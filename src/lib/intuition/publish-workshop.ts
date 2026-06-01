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
import { resolveAtomTermIdForLabel } from "./resolve-label-atom";
import { resolveObjectTermId, resolvePredicateTermId } from "./terms";
import { formatTripleLine } from "@/lib/workshop/triple-draft";

const MAX_SUPPORT_TRIPLES_ONCHAIN = 3;

export interface PublishedAtomRecord {
  label: string;
  termId: Hex;
  created: boolean;
  role: "idea" | "predicate" | "object" | "support-component";
}

export interface PublishedSupportTriple {
  line: string;
  tripleTermId: Hex;
  tripleCreated: boolean;
  subjectAtomId: Hex;
  predicateAtomId: Hex;
  objectAtomId: Hex;
}

export interface WorkshopPublishResult {
  ideaCanonicalId: string;
  network: IntuitionNetwork;
  ideaAtomId: Hex;
  ideaAtomCreated: boolean;
  predicateAtomId: Hex;
  objectAtomId: Hex;
  tripleTermId: Hex;
  tripleCreated: boolean;
  supportTriples: PublishedSupportTriple[];
  atomsPublished: PublishedAtomRecord[];
  skipped: string[];
  txHashes: Hex[];
  graphqlVerified: boolean;
  estimatedCostWei: string;
}

function labelsMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

async function resolveLineAtomId(params: {
  label: string;
  ideaAtomId: Hex;
  ideaTitle: string;
  networkConfig: Awaited<ReturnType<typeof createIntuitionClients>>["config"];
  writeConfig: NonNullable<Awaited<ReturnType<typeof createIntuitionClients>>["writeConfig"]>;
  hintTermId?: Hex;
  role: PublishedAtomRecord["role"];
  atomsPublished: PublishedAtomRecord[];
  txHashes: Hex[];
}): Promise<Hex> {
  if (params.hintTermId) {
    const exists = await multiVaultIsTermCreated(params.writeConfig, {
      args: [params.hintTermId],
    });
    if (exists) return params.hintTermId;
  }

  if (labelsMatch(params.label, params.ideaTitle)) {
    return params.ideaAtomId;
  }

  const resolved = await resolveAtomTermIdForLabel({
    networkConfig: params.networkConfig,
    writeConfig: params.writeConfig,
    label: params.label,
  });
  if (resolved.txHash) params.txHashes.push(resolved.txHash);
  params.atomsPublished.push({
    label: params.label,
    termId: resolved.termId,
    created: resolved.created,
    role: params.role,
  });
  return resolved.termId;
}

export async function publishWorkshopOnchain(params: {
  idea: Idea;
  draft: EnrichedTripleDraft;
  network?: IntuitionNetwork;
  githubBlobUrl?: string;
  includeSupportTriples?: boolean;
}): Promise<WorkshopPublishResult> {
  const clients = await createIntuitionClients(params.network);
  if (!clients.writeConfig) {
    throw new Error("INTUITION_PRIVATE_KEY is required in .env");
  }

  const writeConfig = clients.writeConfig;
  const oc = params.draft.coreTriple.onchain;
  const skipped: string[] = [];
  const txHashes: Hex[] = [];

  const supportLines = params.includeSupportTriples !== false
    ? params.draft.supportTriples.slice(0, MAX_SUPPORT_TRIPLES_ONCHAIN)
    : [];

  const atomCost = await multiVaultGetAtomCost(writeConfig);
  const tripleCost = await multiVaultGetTripleCost(writeConfig);
  const balance = await getNativeBalance(clients);
  const minNeeded =
    atomCost * BigInt(2 + supportLines.length * 2) +
    tripleCost * BigInt(1 + supportLines.length);
  if (balance < minNeeded && !oc?.tripleTermId) {
    throw new Error(
      `Insufficient ${clients.config.nativeSymbol} balance: ${formatEther(balance)} (need ~${formatEther(minNeeded)})`,
    );
  }

  const atomsPublished: PublishedAtomRecord[] = [];
  const supportTriples: PublishedSupportTriple[] = [];
  const ideaTitle = params.draft.ideaTitle || params.idea.title;

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

  atomsPublished.push({
    label: ideaTitle,
    termId: ideaAtomId,
    created: ideaAtomCreated,
    role: "idea",
  });

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

  atomsPublished.push({
    label: params.draft.coreTriple.predicate,
    termId: predicateAtomId,
    created: !oc?.predicateTermId,
    role: "predicate",
  });

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

  atomsPublished.push({
    label: params.draft.coreTriple.object,
    termId: objectAtomId,
    created: !oc?.objectTermId,
    role: "object",
  });

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

  for (const line of supportLines) {
    const subjectId = await resolveLineAtomId({
      label: line.subject,
      ideaAtomId,
      ideaTitle,
      networkConfig: clients.config,
      writeConfig,
      hintTermId: line.onchain?.subjectTermId as Hex | undefined,
      role: "support-component",
      atomsPublished,
      txHashes,
    });
    const predicateId = await resolveLineAtomId({
      label: line.predicate,
      ideaAtomId,
      ideaTitle,
      networkConfig: clients.config,
      writeConfig,
      hintTermId: line.onchain?.predicateTermId as Hex | undefined,
      role: "support-component",
      atomsPublished,
      txHashes,
    });
    const objectId = await resolveLineAtomId({
      label: line.object,
      ideaAtomId,
      ideaTitle,
      networkConfig: clients.config,
      writeConfig,
      hintTermId: line.onchain?.objectTermId as Hex | undefined,
      role: "support-component",
      atomsPublished,
      txHashes,
    });

    const triple = await ensureTriple({
      subjectId,
      predicateId,
      objectId,
      writeConfig,
    });
    if (triple.txHash) txHashes.push(triple.txHash);

    supportTriples.push({
      line: formatTripleLine(line),
      tripleTermId: triple.tripleTermId,
      tripleCreated: triple.created,
      subjectAtomId: subjectId,
      predicateAtomId: predicateId,
      objectAtomId: objectId,
    });
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
    supportTriples,
    atomsPublished,
    skipped,
    txHashes,
    graphqlVerified,
    estimatedCostWei: minNeeded.toString(),
  };
}
