// src/lib/intuition/batch-publish.ts
import {
  batchCreateAtomsFromIpfsUris,
  calculateAtomId,
  calculateTripleId,
  createTripleStatement,
  pinThing,
} from "@0xintuition/sdk";
import { multiVaultGetTripleCost, multiVaultIsTermCreated, type WriteConfig } from "@0xintuition/protocol";
import { toHex, type Hex } from "viem";
import type { Idea } from "@/lib/ideas/schema";
import type { IntuitionNetwork } from "./config";
import { createIntuitionClients } from "./client";
import { ideaToPinThing } from "./idea-thing";
import { resolveObjectTermId, resolvePredicateTermId } from "./terms";

const DEFAULT_CHUNK = 25;
const DEFAULT_TRIPLE_DELAY_MS = 1500;
const RPC_RETRY_MAX = 8;
const RPC_RETRY_BASE_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBandwidthError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Bandwidth limit exceeded");
}

async function withRpcRetry<T>(fn: () => Promise<T>): Promise<T> {
  let delayMs = RPC_RETRY_BASE_MS;
  for (let attempt = 0; attempt < RPC_RETRY_MAX; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isBandwidthError(error) || attempt === RPC_RETRY_MAX - 1) {
        throw error;
      }
      await sleep(delayMs);
      delayMs = Math.min(Math.round(delayMs * 1.5), 30_000);
    }
  }
  throw new Error("withRpcRetry: unreachable");
}

export interface BatchPublishReport {
  network: IntuitionNetwork;
  requested: number;
  atomsPinned: number;
  atomsCreated: number;
  triplesCreated: number;
  skippedExisting: number;
  txHashes: Hex[];
  ideaAtomIds: Array<{ canonicalId: string; termId: Hex; ipfsUri: string }>;
  failed: Array<{ canonicalId: string; reason: string }>;
}

interface PreparedIdea {
  idea: Idea;
  ipfsUri: string;
  termId: Hex;
}

async function prepareIdeas(
  writeConfig: WriteConfig,
  ideas: Idea[],
): Promise<{ toCreate: PreparedIdea[]; existing: PreparedIdea[] }> {
  const toCreate: PreparedIdea[] = [];
  const existing: PreparedIdea[] = [];

  for (const idea of ideas) {
    const uri = await pinThing(ideaToPinThing(idea));
    if (!uri?.startsWith("ipfs://")) {
      throw new Error(`pinThing failed: ${idea.canonicalId}`);
    }
    const termId = calculateAtomId(toHex(uri)) as Hex;
    const row = { idea, ipfsUri: uri, termId };
    const exists = await multiVaultIsTermCreated(writeConfig, { args: [termId] });
    if (exists) existing.push(row);
    else toCreate.push(row);
  }

  return { toCreate, existing };
}

export async function publishIdeasBatch(params: {
  ideas: Idea[];
  network?: IntuitionNetwork;
  chunkSize?: number;
  objectTermId?: Hex;
}): Promise<BatchPublishReport> {
  const clients = await createIntuitionClients(params.network);
  if (!clients.writeConfig) {
    throw new Error("INTUITION_PRIVATE_KEY is required for batch publish");
  }

  const writeConfig = clients.writeConfig;
  const chunkSize =
    params.chunkSize ?? Number(process.env["BATCH_CHUNK_SIZE"] ?? DEFAULT_CHUNK);
  const txHashes: Hex[] = [];
  const ideaAtomIds: BatchPublishReport["ideaAtomIds"] = [];
  const failed: BatchPublishReport["failed"] = [];

  const { toCreate, existing } = await prepareIdeas(writeConfig, params.ideas);

  for (const item of existing) {
    ideaAtomIds.push({
      canonicalId: item.idea.canonicalId,
      termId: item.termId,
      ipfsUri: item.ipfsUri,
    });
  }

  let atomsCreated = 0;
  for (let i = 0; i < toCreate.length; i += chunkSize) {
    const chunk = toCreate.slice(i, i + chunkSize);
    const uris = chunk.map((row) => row.ipfsUri);
    const batch = await batchCreateAtomsFromIpfsUris(writeConfig, uris);
    txHashes.push(batch.transactionHash);
    atomsCreated += batch.state.length;

    for (let j = 0; j < chunk.length; j++) {
      const row = chunk[j];
      const state = batch.state[j];
      if (!row || !state) continue;
      ideaAtomIds.push({
        canonicalId: row.idea.canonicalId,
        termId: state.termId as Hex,
        ipfsUri: row.ipfsUri,
      });
    }
  }

  const predicate = await resolvePredicateTermId({
    networkConfig: clients.config,
    writeConfig,
  });
  if (predicate.txHash) txHashes.push(predicate.txHash);

  const object = await resolveObjectTermId({
    networkConfig: clients.config,
    writeConfig,
    override: params.objectTermId,
  });
  if (object.txHash) txHashes.push(object.txHash);

  const tripleCost = await multiVaultGetTripleCost(writeConfig);
  let triplesCreated = 0;

  const tripleDelayMs = Number(
    process.env["TRIPLE_DELAY_MS"] ?? DEFAULT_TRIPLE_DELAY_MS,
  );

  for (const { canonicalId, termId } of ideaAtomIds) {
    try {
      const result = await ensureTripleForIdea({
        subjectId: termId,
        predicateId: predicate.termId,
        objectId: object.termId,
        writeConfig,
        tripleCost,
        txHashes,
      });
      if (result.created) triplesCreated += 1;
      if (tripleDelayMs > 0) await sleep(tripleDelayMs);
    } catch (error) {
      failed.push({
        canonicalId,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    network: clients.config.network,
    requested: params.ideas.length,
    atomsPinned: params.ideas.length,
    atomsCreated,
    triplesCreated,
    skippedExisting: existing.length,
    txHashes,
    ideaAtomIds,
    failed,
  };
}

async function ensureTripleForIdea(params: {
  subjectId: Hex;
  predicateId: Hex;
  objectId: Hex;
  writeConfig: WriteConfig;
  tripleCost: bigint;
  txHashes: Hex[];
}): Promise<{ created: boolean }> {
  const tripleTermId = calculateTripleId(
    params.subjectId,
    params.predicateId,
    params.objectId,
  ) as Hex;

  const exists = await withRpcRetry(() =>
    multiVaultIsTermCreated(params.writeConfig, {
      args: [tripleTermId],
    }),
  );
  if (exists) return { created: false };

  const assets = params.tripleCost;
  const result = await withRpcRetry(() =>
    createTripleStatement(params.writeConfig, {
      args: [[params.subjectId], [params.predicateId], [params.objectId], [assets]],
      value: assets,
    }),
  );
  params.txHashes.push(result.transactionHash);
  return { created: true };
}

export async function retryMissingTriples(params: {
  ideaAtomIds: BatchPublishReport["ideaAtomIds"];
  network?: IntuitionNetwork;
  objectTermId?: Hex;
  predicateTermId?: Hex;
  tripleCostWei?: bigint;
}): Promise<{
  triplesCreated: number;
  skippedExisting: number;
  failed: BatchPublishReport["failed"];
  txHashes: Hex[];
}> {
  const clients = await createIntuitionClients(params.network);
  if (!clients.writeConfig) {
    throw new Error("INTUITION_PRIVATE_KEY is required");
  }

  const writeConfig = clients.writeConfig;
  const txHashes: Hex[] = [];
  const failed: BatchPublishReport["failed"] = [];

  const predicateId =
    params.predicateTermId ??
    (
      await withRpcRetry(() =>
        resolvePredicateTermId({
          networkConfig: clients.config,
          writeConfig,
        }),
      )
    ).termId;

  const objectId =
    params.objectTermId ??
    (
      await withRpcRetry(() =>
        resolveObjectTermId({
          networkConfig: clients.config,
          writeConfig,
          override: params.objectTermId,
        }),
      )
    ).termId;

  const tripleCost =
    params.tripleCostWei ??
    (process.env["TRIPLE_COST_WEI"]
      ? BigInt(process.env["TRIPLE_COST_WEI"])
      : await withRpcRetry(() => multiVaultGetTripleCost(writeConfig)));
  const tripleDelayMs = Number(
    process.env["TRIPLE_DELAY_MS"] ?? DEFAULT_TRIPLE_DELAY_MS,
  );

  let triplesCreated = 0;
  let skippedExisting = 0;

  for (const { canonicalId, termId } of params.ideaAtomIds) {
    try {
      const result = await ensureTripleForIdea({
        subjectId: termId,
        predicateId,
        objectId,
        writeConfig,
        tripleCost,
        txHashes,
      });
      if (result.created) triplesCreated += 1;
      else skippedExisting += 1;
      if (tripleDelayMs > 0) await sleep(tripleDelayMs);
    } catch (error) {
      failed.push({
        canonicalId,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { triplesCreated, skippedExisting, failed, txHashes };
}
