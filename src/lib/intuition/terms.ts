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

  const rows = await findAtomsByLabel(params.networkConfig, "Intuition Protocol");
  const canonical = pickCanonicalAtom(rows);
  if (canonical) {
    return { termId: canonical.term_id as Hex, created: false };
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
  const rows = await findAtomsByLabel(
    params.networkConfig,
    IDEA_PREDICATE_LABEL,
  );
  const canonical = pickCanonicalAtom(rows);
  if (canonical) {
    return {
      termId: canonical.term_id as Hex,
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
