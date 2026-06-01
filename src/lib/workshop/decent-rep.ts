// src/lib/workshop/decent-rep.ts
import type { IntuitionNetwork } from "@/lib/intuition/config";
import { getNetworkConfig } from "@/lib/intuition/config";
import type { WorkshopPublishResult } from "@/lib/intuition/publish-workshop";

export interface OnchainPublishSummary {
  publishedAt: string;
  network: IntuitionNetwork;
  ideaAtomId: string;
  tripleTermId: string;
  ideaAtomCreated: boolean;
  tripleCreated: boolean;
  supportTripleCount: number;
  txCount: number;
  portalHome: string;
  explorerBase: string;
}

export const DECENT_REP_PRINCIPLES = [
  "One atom = one thing (short label, not a full sentence).",
  "Core bounty triple: [your idea] → top project ideas for → Intuition Protocol.",
  "Reuse canonical predicates and objects already on the graph when possible.",
  "Support triples extend the reputation model; nested triples stay off-chain unless you publish manually.",
  "Publishing on-chain costs testnet TRUST — staking more signal comes after the atom exists.",
] as const;

export function isOnchainPublishConfigured(): boolean {
  return Boolean(process.env["INTUITION_PRIVATE_KEY"]?.trim());
}

export function summarizeOnchainPublish(
  result: WorkshopPublishResult,
): OnchainPublishSummary {
  const config = getNetworkConfig(result.network);
  return {
    publishedAt: new Date().toISOString(),
    network: result.network,
    ideaAtomId: result.ideaAtomId,
    tripleTermId: result.tripleTermId,
    ideaAtomCreated: result.ideaAtomCreated,
    tripleCreated: result.tripleCreated,
    supportTripleCount: result.supportTriples.length,
    txCount: result.txHashes.length,
    portalHome:
      result.network === "mainnet"
        ? "https://portal.intuition.systems/explore/home"
        : "https://testnet.portal.intuition.systems/explore/home",
    explorerBase: config.explorer,
  };
}

export function atomExplorerUrl(explorerBase: string, termId: string): string {
  return `${explorerBase}/atom/${termId}`;
}
