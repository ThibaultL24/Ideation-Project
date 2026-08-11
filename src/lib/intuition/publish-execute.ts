// src/lib/intuition/publish-execute.ts
import { getAtomDetails } from "@0xintuition/sdk";
import type { WriteConfig } from "@0xintuition/protocol";
import { type Hex } from "viem";
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import type { Idea } from "@/lib/ideas/schema";
import { countTriplesInGraphql } from "./graphql";
import type { IntuitionNetwork } from "./config";
import { getNetworkConfig } from "./config";
import { ensureAtomFromIdea } from "./atoms";
import { ensureTriple } from "./triples";
import {
  lookupObjectTermId,
  lookupPredicateTermId,
  resolveObjectTermId,
  resolvePredicateTermId,
} from "./terms";
import {
  explorerAtomUrl,
  previewOnchainPublish,
  type OnchainPublishPreview,
} from "./publish-preview";
import { ensureSdkGraphqlClient } from "./sdk-setup";

export interface PublishIdeaResult {
  mode: "published" | "already_complete" | "partial";
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
  coreTripleQueryable: boolean;
  atomLabel?: string;
  estimatedCostWei: string;
  preview: OnchainPublishPreview;
  explorerUrls: {
    ideaAtom?: string;
    triple?: string;
  };
}

const INDEXER_WAIT_MS = Number(process.env["INTUITION_INDEXER_WAIT_MS"] ?? 3000);

function alreadyCompleteResult(
  idea: Idea,
  preview: OnchainPublishPreview,
): PublishIdeaResult {
  const ideaAtomId = preview.steps.find((s) => s.id === "ideaAtom")?.termId;
  const tripleTermId = preview.steps.find((s) => s.id === "coreTriple")?.termId;
  if (!ideaAtomId || !tripleTermId) {
    throw new Error("Preview marked complete but term ids are missing.");
  }
  const predicateAtomId =
    preview.steps.find((s) => s.id === "predicateAtom")?.termId ?? ideaAtomId;
  const objectAtomId =
    preview.steps.find((s) => s.id === "objectAtom")?.termId ?? ideaAtomId;

  return {
    mode: "already_complete",
    ideaCanonicalId: idea.canonicalId,
    network: preview.network,
    ipfsUri: preview.ideaIpfsUri ?? "",
    ideaAtomId,
    ideaAtomCreated: false,
    predicateAtomId,
    predicateAtomCreated: false,
    objectAtomId,
    tripleTermId,
    tripleCreated: false,
    txHashes: [],
    graphqlVerified: true,
    coreTripleQueryable: true,
    estimatedCostWei: "0",
    preview,
    explorerUrls: {
      ideaAtom: explorerAtomUrl(preview.explorerBase, ideaAtomId),
      triple: explorerAtomUrl(preview.explorerBase, tripleTermId),
    },
  };
}

/**
 * Publish idea atom + core triple using a provided WriteConfig (user wallet or script key).
 */
export async function publishIdeaWithWriteConfig(params: {
  idea: Idea;
  writeConfig?: WriteConfig;
  draft?: Partial<BrainstormDraft> | null;
  githubBlobUrl?: string;
  network?: IntuitionNetwork;
  preview?: OnchainPublishPreview;
  dryRun?: boolean;
}): Promise<PublishIdeaResult> {
  const preview =
    params.preview ??
    (await previewOnchainPublish({
      idea: params.idea,
      draft: params.draft,
      githubBlobUrl: params.githubBlobUrl,
      network: params.network,
    }));

  if (params.dryRun) {
    return buildDryRunResult(params.idea, preview);
  }

  if (preview.alreadyComplete) {
    return alreadyCompleteResult(params.idea, preview);
  }

  const structuralBlockers = preview.blockers.filter(
    (b) => !/wallet|private.?key|connect/i.test(b),
  );
  if (structuralBlockers.length > 0 || !preview.variantNeedsPublish) {
    throw new Error(
      structuralBlockers.join(" ") || "On-chain publish is blocked.",
    );
  }

  const writeConfig = params.writeConfig;
  if (!writeConfig) {
    throw new Error("A connected wallet (WriteConfig) is required to publish.");
  }

  const networkConfig = getNetworkConfig(params.network ?? preview.network);
  ensureSdkGraphqlClient(networkConfig);
  const txHashes: Hex[] = [];

  const ideaAtom = await ensureAtomFromIdea({
    idea: params.idea,
    writeConfig,
    githubBlobUrl: params.githubBlobUrl,
    draft: params.draft,
    // Preview already pinned on the server — reuse to avoid a second pin round-trip.
    ipfsUri: preview.ideaIpfsUri,
  });
  if (ideaAtom.txHash) txHashes.push(ideaAtom.txHash);

  const predicate = await resolvePredicateTermId({
    networkConfig,
    writeConfig,
  });
  if (predicate.txHash) txHashes.push(predicate.txHash);

  const object = await resolveObjectTermId({
    networkConfig,
    writeConfig,
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
  let coreTripleQueryable = false;
  let atomLabel: string | undefined;

  try {
    const details = await getAtomDetails(ideaAtom.termId);
    graphqlVerified = Boolean(details?.label);
    atomLabel = details?.label ?? undefined;
  } catch {
    graphqlVerified = false;
  }

  const predicateId =
    (await lookupPredicateTermId(networkConfig)) ?? predicate.termId;
  const objectId = (await lookupObjectTermId(networkConfig)) ?? object.termId;
  try {
    const count = await countTriplesInGraphql(
      networkConfig,
      [ideaAtom.termId],
      predicateId,
      objectId,
    );
    coreTripleQueryable = count > 0;
  } catch {
    coreTripleQueryable = false;
  }

  const createdCount =
    Number(ideaAtom.created) +
    Number(predicate.created) +
    Number(object.created) +
    Number(triple.created);

  return {
    mode: createdCount > 0 ? "published" : "partial",
    ideaCanonicalId: params.idea.canonicalId,
    network: networkConfig.network,
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
    coreTripleQueryable,
    atomLabel,
    estimatedCostWei: preview.totalEstimatedCostWei,
    preview,
    explorerUrls: {
      ideaAtom: explorerAtomUrl(preview.explorerBase, ideaAtom.termId),
      triple: explorerAtomUrl(preview.explorerBase, triple.tripleTermId),
    },
  };
}

export function buildDryRunResult(
  idea: Idea,
  preview: OnchainPublishPreview,
): PublishIdeaResult {
  const ideaAtomId = preview.steps.find((s) => s.id === "ideaAtom")?.termId;
  const tripleTermId = preview.steps.find((s) => s.id === "coreTriple")?.termId;
  const predicateAtomId = preview.steps.find((s) => s.id === "predicateAtom")
    ?.termId;
  const objectAtomId = preview.steps.find((s) => s.id === "objectAtom")?.termId;

  if (!ideaAtomId || !tripleTermId || !predicateAtomId || !objectAtomId) {
    throw new Error("Dry-run preview is missing term ids.");
  }

  return {
    mode: preview.alreadyComplete ? "already_complete" : "partial",
    ideaCanonicalId: idea.canonicalId,
    network: preview.network,
    ipfsUri: preview.ideaIpfsUri ?? "",
    ideaAtomId,
    ideaAtomCreated: preview.steps.find((s) => s.id === "ideaAtom")?.willCreate ?? false,
    predicateAtomId,
    predicateAtomCreated:
      preview.steps.find((s) => s.id === "predicateAtom")?.willCreate ?? false,
    objectAtomId,
    tripleTermId,
    tripleCreated: preview.steps.find((s) => s.id === "coreTriple")?.willCreate ?? false,
    txHashes: [],
    graphqlVerified: false,
    coreTripleQueryable: preview.alreadyComplete,
    estimatedCostWei: preview.totalEstimatedCostWei,
    preview,
    explorerUrls: {
      ideaAtom: explorerAtomUrl(preview.explorerBase, ideaAtomId),
      triple: explorerAtomUrl(preview.explorerBase, tripleTermId),
    },
  };
}

export { previewOnchainPublish };
