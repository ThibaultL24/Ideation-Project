// src/lib/intuition/publish-workshop.ts
import { getAtomDetails } from "@0xintuition/sdk";
import {
  multiVaultGetAtomCost,
  multiVaultGetTripleCost,
  multiVaultIsTermCreated,
} from "@0xintuition/protocol";
import { formatEther, type Hex } from "viem";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import type { Idea } from "@/lib/ideas/schema";
import type { IntuitionNetwork } from "./config";
import { createIntuitionClients, getNativeBalance } from "./client";
import { ensureAtomFromIdea } from "./atoms";
import { ensureTriple } from "./triples";
import { resolveObjectTermId, resolvePredicateTermId } from "./terms";

export interface WorkshopPublishResult {
  ideaCanonicalId: string;
  network: IntuitionNetwork;
  ideaAtomId: Hex;
  ideaAtomCreated: boolean;
  predicateAtomId: Hex;
  objectAtomId: Hex;
  tripleTermId: Hex;
  tripleCreated: boolean;
  skipped: string[];
  txHashes: Hex[];
  graphqlVerified: boolean;
  estimatedCostWei: string;
}

export async function publishWorkshopOnchain(params: {
  idea: Idea;
  draft: EnrichedTripleDraft;
  network?: IntuitionNetwork;
  githubBlobUrl?: string;
}): Promise<WorkshopPublishResult> {
  const clients = await createIntuitionClients(params.network);
  if (!clients.writeConfig) {
    throw new Error("INTUITION_PRIVATE_KEY is required in .env");
  }

  const writeConfig = clients.writeConfig;
  const oc = params.draft.coreTriple.onchain;
  const skipped: string[] = [];
  const txHashes: Hex[] = [];

  const atomCost = await multiVaultGetAtomCost(writeConfig);
  const tripleCost = await multiVaultGetTripleCost(writeConfig);
  const balance = await getNativeBalance(clients);
  const minNeeded = atomCost * BigInt(2) + tripleCost;
  if (balance < minNeeded && !oc?.tripleTermId) {
    throw new Error(
      `Solde ${clients.config.nativeSymbol} insuffisant : ${formatEther(balance)} (besoin ~${formatEther(minNeeded)})`,
    );
  }

  let ideaAtomId: Hex;
  let ideaAtomCreated = false;

  if (oc?.subjectTermId) {
    const exists = await multiVaultIsTermCreated(writeConfig, {
      args: [oc.subjectTermId as Hex],
    });
    if (exists) {
      ideaAtomId = oc.subjectTermId as Hex;
      skipped.push("subject-atom");
    } else {
      const atom = await ensureAtomFromIdea({
        idea: params.idea,
        writeConfig,
        githubBlobUrl: params.githubBlobUrl,
      });
      ideaAtomId = atom.termId;
      ideaAtomCreated = atom.created;
      if (atom.txHash) txHashes.push(atom.txHash);
    }
  } else {
    const atom = await ensureAtomFromIdea({
      idea: params.idea,
      writeConfig,
      githubBlobUrl: params.githubBlobUrl,
    });
    ideaAtomId = atom.termId;
    ideaAtomCreated = atom.created;
    if (atom.txHash) txHashes.push(atom.txHash);
  }

  let predicateAtomId: Hex;
  if (oc?.predicateTermId) {
    predicateAtomId = oc.predicateTermId as Hex;
    skipped.push("predicate-atom");
  } else {
    const pred = await resolvePredicateTermId({
      networkConfig: clients.config,
      writeConfig,
    });
    predicateAtomId = pred.termId;
    if (pred.txHash) txHashes.push(pred.txHash);
  }

  let objectAtomId: Hex;
  if (oc?.objectTermId) {
    objectAtomId = oc.objectTermId as Hex;
    skipped.push("object-atom");
  } else {
    const obj = await resolveObjectTermId({
      networkConfig: clients.config,
      writeConfig,
      override: undefined,
    });
    objectAtomId = obj.termId;
    if (obj.txHash) txHashes.push(obj.txHash);
  }

  let tripleTermId: Hex;
  let tripleCreated = false;

  if (oc?.tripleTermId) {
    const exists = await multiVaultIsTermCreated(writeConfig, {
      args: [oc.tripleTermId as Hex],
    });
    if (exists) {
      tripleTermId = oc.tripleTermId as Hex;
      skipped.push("core-triple");
    } else {
      const triple = await ensureTriple({
        subjectId: ideaAtomId,
        predicateId: predicateAtomId,
        objectId: objectAtomId,
        writeConfig,
      });
      tripleTermId = triple.tripleTermId;
      tripleCreated = triple.created;
      if (triple.txHash) txHashes.push(triple.txHash);
    }
  } else {
    const triple = await ensureTriple({
      subjectId: ideaAtomId,
      predicateId: predicateAtomId,
      objectId: objectAtomId,
      writeConfig,
    });
    tripleTermId = triple.tripleTermId;
    tripleCreated = triple.created;
    if (triple.txHash) txHashes.push(triple.txHash);
  }

  const waitMs = Number(process.env["INTUITION_INDEXER_WAIT_MS"] ?? 2000);
  if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));

  let graphqlVerified = false;
  try {
    const details = await getAtomDetails(ideaAtomId);
    graphqlVerified = Boolean(details?.label);
  } catch {
    graphqlVerified = false;
  }

  return {
    ideaCanonicalId: params.idea.canonicalId,
    network: clients.config.network,
    ideaAtomId,
    ideaAtomCreated,
    predicateAtomId,
    objectAtomId,
    tripleTermId,
    tripleCreated,
    skipped,
    txHashes,
    graphqlVerified,
    estimatedCostWei: minNeeded.toString(),
  };
}
