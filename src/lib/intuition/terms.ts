// src/lib/intuition/terms.ts
import type { WriteConfig } from "@0xintuition/protocol";
import type { Hex } from "viem";
import {
  IDEA_PREDICATE_LABEL,
  MAINNET_INTUITION_PROTOCOL_TERM_ID,
  type IntuitionNetworkConfig,
} from "./config";
import { findAtomsByLabel, pickCanonicalAtom } from "./graphql";
import { ensureAtomFromLabel, type EnsureAtomResult } from "./atoms";

export async function lookupObjectTermId(
  networkConfig: IntuitionNetworkConfig,
): Promise<Hex | null> {
  if (networkConfig.network === "mainnet") {
    return MAINNET_INTUITION_PROTOCOL_TERM_ID;
  }
  const rows = await findAtomsByLabel(networkConfig, "Intuition Protocol", 10);
  const canonical = pickCanonicalAtom(rows);
  return canonical ? (canonical.term_id as Hex) : null;
}

export async function lookupPredicateTermId(
  networkConfig: IntuitionNetworkConfig,
): Promise<Hex | null> {
  const rows = await findAtomsByLabel(
    networkConfig,
    IDEA_PREDICATE_LABEL,
    10,
  );
  const canonical = pickCanonicalAtom(rows);
  return canonical ? (canonical.term_id as Hex) : null;
}

export async function resolveObjectTermId(params: {
  networkConfig: IntuitionNetworkConfig;
  writeConfig: WriteConfig;
  override?: Hex;
}): Promise<{ termId: Hex; created: boolean; txHash?: Hex }> {
  if (params.override) {
    return { termId: params.override, created: false };
  }

  if (params.networkConfig.network === "mainnet") {
    return { termId: MAINNET_INTUITION_PROTOCOL_TERM_ID, created: false };
  }

  const existing = await lookupObjectTermId(params.networkConfig);
  if (existing) {
    return { termId: existing, created: false };
  }

  const created = await ensureAtomFromLabel({
    name: "Intuition Protocol",
    description: "Intuition knowledge graph protocol",
    writeConfig: params.writeConfig,
  });
  return {
    termId: created.termId,
    created: created.created,
    txHash: created.txHash,
  };
}

export async function resolvePredicateTermId(params: {
  networkConfig: IntuitionNetworkConfig;
  writeConfig: WriteConfig;
}): Promise<EnsureAtomResult & { termId: Hex }> {
  const existing = await lookupPredicateTermId(params.networkConfig);
  if (existing) {
    return {
      termId: existing,
      ipfsUri: "",
      created: false,
    };
  }

  return ensureAtomFromLabel({
    name: IDEA_PREDICATE_LABEL,
    description: `Predicate: ${IDEA_PREDICATE_LABEL}`,
    writeConfig: params.writeConfig,
  });
}
