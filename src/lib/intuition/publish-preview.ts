// src/lib/intuition/publish-preview.ts
import {
  calculateAtomId,
  calculateTripleId,
} from "@0xintuition/sdk";
import {
  multiVaultGetAtomCost,
  multiVaultGetTripleCost,
  multiVaultIsTermCreated,
} from "@0xintuition/protocol";
import { formatEther, toHex, type Hex } from "viem";
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import type { Idea } from "@/lib/ideas/schema";
import { createIntuitionClients } from "./client";
import {
  BOUNTY_PREDICATE_LABEL,
  getPortalAtomBaseUrl,
  INTUITION_PROTOCOL_OBJECT_LABEL,
  type IntuitionNetwork,
} from "./config";
import { ideaToPinThing } from "./idea-thing";
import { pinThingForNetwork } from "./pin-thing";
import { ensureSdkGraphqlClient } from "./sdk-setup";
import { lookupObjectTermId, lookupPredicateTermId } from "./terms";

export interface OnchainPublishStep {
  id: "ideaAtom" | "predicateAtom" | "objectAtom" | "coreTriple";
  label: string;
  termId: Hex | null;
  exists: boolean;
  willCreate: boolean;
  estimatedCostWei: string;
}

export interface OnchainPublishPreview {
  network: IntuitionNetwork;
  nativeSymbol: string;
  multivault: Hex;
  /** Always false for the dapp — users pay with their connected wallet. */
  walletConfigured: boolean;
  walletAddress?: string;
  walletBalanceWei?: string;
  walletBalanceFormatted?: string;
  /** How the UI should pay for createAtom / createTriple. */
  paymentMode: "user_wallet";
  coreTriple: [string, string, string];
  ideaIpfsUri?: string;
  steps: OnchainPublishStep[];
  totalEstimatedCostWei: string;
  totalEstimatedCostFormatted: string;
  alreadyComplete: boolean;
  /** True when this brainstorm variant (IPFS fingerprint) is not on-chain yet. */
  variantNeedsPublish: boolean;
  /**
   * Protocol-side readiness (IPFS + term ids). Wallet connect / balance are
   * checked in the browser before signing.
   */
  canPublish: boolean;
  blockers: string[];
  explorerBase: string;
}

async function termExists(
  publicClient: Awaited<ReturnType<typeof createIntuitionClients>>["publicClient"],
  multivault: Hex,
  termId: Hex,
): Promise<boolean> {
  return multiVaultIsTermCreated(
    { address: multivault, publicClient },
    { args: [termId] },
  );
}

export async function previewOnchainPublish(params: {
  idea: Idea;
  draft?: Partial<BrainstormDraft> | null;
  githubBlobUrl?: string;
  network?: IntuitionNetwork;
}): Promise<OnchainPublishPreview> {
  const clients = await createIntuitionClients(params.network);
  ensureSdkGraphqlClient(clients.config);

  const { config, publicClient } = clients;
  const multivault = config.multivault;
  const readConfig = { address: multivault, publicClient };

  const [atomCost, tripleCost] = await Promise.all([
    multiVaultGetAtomCost(readConfig),
    multiVaultGetTripleCost(readConfig),
  ]);

  const blockers: string[] = [];

  let ideaIpfsUri: string | undefined;
  let ideaTermId: Hex | null = null;

  try {
    const uri = await pinThingForNetwork(
      config,
      ideaToPinThing(params.idea, params.githubBlobUrl, params.draft),
    );
    ideaIpfsUri = uri;
    ideaTermId = calculateAtomId(toHex(uri)) as Hex;
  } catch {
    blockers.push(`IPFS pin failed for "${params.idea.title}".`);
  }

  let predicateTermId = await lookupPredicateTermId(config);
  let objectTermId = await lookupObjectTermId(config);

  const steps: OnchainPublishStep[] = [];

  if (ideaTermId) {
    const exists = await termExists(publicClient, multivault, ideaTermId);
    steps.push({
      id: "ideaAtom",
      label: params.idea.title,
      termId: ideaTermId,
      exists,
      willCreate: !exists,
      estimatedCostWei: exists ? "0" : atomCost.toString(),
    });
  } else {
    steps.push({
      id: "ideaAtom",
      label: params.idea.title,
      termId: null,
      exists: false,
      willCreate: true,
      estimatedCostWei: atomCost.toString(),
    });
    blockers.push("Could not resolve idea atom term id.");
  }

  if (predicateTermId) {
    const exists = await termExists(publicClient, multivault, predicateTermId);
    steps.push({
      id: "predicateAtom",
      label: BOUNTY_PREDICATE_LABEL,
      termId: predicateTermId,
      exists,
      willCreate: !exists,
      estimatedCostWei: exists ? "0" : atomCost.toString(),
    });
  } else {
    predicateTermId = null;
    steps.push({
      id: "predicateAtom",
      label: BOUNTY_PREDICATE_LABEL,
      termId: null,
      exists: false,
      willCreate: true,
      estimatedCostWei: atomCost.toString(),
    });
  }

  if (objectTermId) {
    const exists = await termExists(publicClient, multivault, objectTermId);
    steps.push({
      id: "objectAtom",
      label: INTUITION_PROTOCOL_OBJECT_LABEL,
      termId: objectTermId,
      exists,
      willCreate: !exists,
      estimatedCostWei: exists ? "0" : atomCost.toString(),
    });
  } else {
    objectTermId = null;
    steps.push({
      id: "objectAtom",
      label: INTUITION_PROTOCOL_OBJECT_LABEL,
      termId: null,
      exists: false,
      willCreate: true,
      estimatedCostWei: atomCost.toString(),
    });
  }

  let tripleTermId: Hex | null = null;
  let tripleExists = false;
  if (ideaTermId && predicateTermId && objectTermId) {
    tripleTermId = calculateTripleId(ideaTermId, predicateTermId, objectTermId) as Hex;
    tripleExists = await termExists(publicClient, multivault, tripleTermId);
  }

  steps.push({
    id: "coreTriple",
    label: `[${params.idea.title}] - [${BOUNTY_PREDICATE_LABEL}] - [Intuition]`,
    termId: tripleTermId,
    exists: tripleExists,
    willCreate: Boolean(tripleTermId) && !tripleExists,
    estimatedCostWei: tripleExists ? "0" : tripleCost.toString(),
  });

  const totalEstimatedCostWei = steps
    .reduce((sum, step) => sum + BigInt(step.estimatedCostWei), BigInt(0))
    .toString();

  const ideaStep = steps.find((s) => s.id === "ideaAtom");
  const tripleStep = steps.find((s) => s.id === "coreTriple");
  const alreadyComplete = Boolean(ideaStep?.exists && tripleStep?.exists);
  const variantNeedsPublish = Boolean(
    ideaStep?.willCreate || tripleStep?.willCreate,
  );

  // Dapp users sign & pay with their own wallet. Server key is for scripts only.
  const canPublish = variantNeedsPublish && blockers.length === 0;

  return {
    network: config.network,
    nativeSymbol: config.nativeSymbol,
    multivault,
    walletConfigured: false,
    paymentMode: "user_wallet",
    coreTriple: [params.idea.title, BOUNTY_PREDICATE_LABEL, "Intuition"],
    ideaIpfsUri,
    steps,
    totalEstimatedCostWei,
    totalEstimatedCostFormatted: formatEther(BigInt(totalEstimatedCostWei)),
    alreadyComplete,
    variantNeedsPublish,
    canPublish,
    blockers,
    explorerBase: getPortalAtomBaseUrl(config.network),
  };
}

export function formatExplorerAtomUrl(explorerBase: string, termId: Hex): string {
  return `${explorerBase.replace(/\/$/, "")}/atom/${termId}`;
}

/** @deprecated Use formatExplorerAtomUrl */
export const explorerAtomUrl = formatExplorerAtomUrl;
