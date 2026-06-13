// src/lib/intuition/publish-idea.ts
import { getAtomDetails } from "@0xintuition/sdk";
import { formatEther, type Hex } from "viem";
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import type { Idea } from "@/lib/ideas/schema";
import { countTriplesInGraphql } from "./graphql";
import type { IntuitionNetwork } from "./config";
import { getNetworkConfig } from "./config";
import { createIntuitionClients } from "./client";
import { ensureAtomFromIdea } from "./atoms";
import { ensureTriple } from "./triples";
import { lookupObjectTermId, lookupPredicateTermId, resolveObjectTermId, resolvePredicateTermId } from "./terms";
import {
  explorerAtomUrl,
  previewOnchainPublish,
  type OnchainPublishPreview,
} from "./publish-preview";

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

export async function publishIdeaOnchain(params: {
  idea: Idea;
  draft?: Partial<BrainstormDraft> | null;
  githubBlobUrl?: string;
  network?: IntuitionNetwork;
  dryRun?: boolean;
}): Promise<PublishIdeaResult> {
  const preview = await previewOnchainPublish({
    idea: params.idea,
    draft: params.draft,
    githubBlobUrl: params.githubBlobUrl,
    network: params.network,
  });

  if (params.dryRun) {
    return buildDryRunResult(params.idea, preview);
  }

  if (preview.alreadyComplete) {
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
      ideaCanonicalId: params.idea.canonicalId,
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

  if (!preview.canPublish) {
    throw new Error(preview.blockers.join(" ") || "On-chain publish is blocked.");
  }

  const clients = await createIntuitionClients(params.network);
  if (!clients.writeConfig) {
    throw new Error(
      "INTUITION_PRIVATE_KEY is required. Copy .env.example → .env",
    );
  }

  const writeConfig = clients.writeConfig;
  const txHashes: Hex[] = [];

  const ideaAtom = await ensureAtomFromIdea({
    idea: params.idea,
    writeConfig,
    githubBlobUrl: params.githubBlobUrl,
    draft: params.draft,
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

  const config = getNetworkConfig(preview.network);
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
    (await lookupPredicateTermId(config)) ?? predicate.termId;
  const objectId = (await lookupObjectTermId(config)) ?? object.termId;
  try {
    const count = await countTriplesInGraphql(
      config,
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

function buildDryRunResult(idea: Idea, preview: OnchainPublishPreview): PublishIdeaResult {
  const ideaAtomId = preview.steps.find((s) => s.id === "ideaAtom")?.termId;
  const tripleTermId = preview.steps.find((s) => s.id === "coreTriple")?.termId;
  const predicateAtomId = preview.steps.find((s) => s.id === "predicateAtom")?.termId;
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
