// src/lib/intuition/publish-idea.ts
import { getAtomDetails } from "@0xintuition/sdk";
import {
  multiVaultGetAtomCost,
  multiVaultGetTripleCost,
} from "@0xintuition/protocol";
import { formatEther, type Hex } from "viem";
import type { Idea } from "@/lib/ideas/schema";
import type { IntuitionNetwork } from "./config";
import { createIntuitionClients, getNativeBalance } from "./client";
import { ensureAtomFromIdea } from "./atoms";
import { ensureTriple } from "./triples";
import { resolveObjectTermId, resolvePredicateTermId } from "./terms";

export interface PublishIdeaResult {
  ideaCanonicalId: string;
  network: IntuitionNetwork;
  ipfsUri: string;
  ideaAtomId: Hex;
  ideaAtomCreated: boolean;
  predicateAtomId: Hex;
  predicateAtomCreated: boolean;
  objectAtomId: Hex;
  tripleTermId: Hex;
  tripleCreated: boolean;
  txHashes: Hex[];
  graphqlVerified: boolean;
  atomLabel?: string;
  estimatedCostWei: string;
}

const INDEXER_WAIT_MS = Number(process.env["INTUITION_INDEXER_WAIT_MS"] ?? 2000);

export async function publishIdeaOnchain(params: {
  idea: Idea;
  network?: IntuitionNetwork;
  objectTermId?: Hex;
}): Promise<PublishIdeaResult> {
  const clients = await createIntuitionClients(params.network);
  if (!clients.writeConfig) {
    throw new Error(
      "INTUITION_PRIVATE_KEY is required. Copy .env.example → .env",
    );
  }

  const writeConfig = clients.writeConfig;
  const atomCost = await multiVaultGetAtomCost(writeConfig);
  const tripleCost = await multiVaultGetTripleCost(writeConfig);
  const minNeeded = atomCost * BigInt(2) + tripleCost;

  const balance = await getNativeBalance(clients);
  if (balance < minNeeded) {
    throw new Error(
      `Insufficient ${clients.config.nativeSymbol}: have ${formatEther(balance)}, need ~${formatEther(minNeeded)}`,
    );
  }

  const txHashes: Hex[] = [];

  const ideaAtom = await ensureAtomFromIdea({
    idea: params.idea,
    writeConfig,
  });
  if (ideaAtom.txHash) txHashes.push(ideaAtom.txHash);

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

  const triple = await ensureTriple({
    subjectId: ideaAtom.termId,
    predicateId: predicate.termId,
    objectId: object.termId,
    writeConfig,
  });
  if (triple.txHash) txHashes.push(triple.txHash);

  if (INDEXER_WAIT_MS > 0) {
    await new Promise((r) => setTimeout(r, INDEXER_WAIT_MS));
  }

  let graphqlVerified = false;
  let atomLabel: string | undefined;
  try {
    const details = await getAtomDetails(ideaAtom.termId);
    graphqlVerified = Boolean(details?.label);
    atomLabel = details?.label ?? undefined;
  } catch {
    graphqlVerified = false;
  }

  return {
    ideaCanonicalId: params.idea.canonicalId,
    network: clients.config.network,
    ipfsUri: ideaAtom.ipfsUri,
    ideaAtomId: ideaAtom.termId,
    ideaAtomCreated: ideaAtom.created,
    predicateAtomId: predicate.termId,
    predicateAtomCreated: predicate.created,
    objectAtomId: object.termId,
    tripleTermId: triple.tripleTermId,
    tripleCreated: triple.created,
    txHashes,
    graphqlVerified,
    atomLabel,
    estimatedCostWei: minNeeded.toString(),
  };
}
