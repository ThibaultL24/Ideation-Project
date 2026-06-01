// src/lib/intuition/resolve-label-atom.ts
import type { WriteConfig } from "@0xintuition/protocol";
import type { Hex } from "viem";
import type { IntuitionNetworkConfig } from "./config";
import { ensureAtomFromLabel } from "./atoms";
import { findAtomsByLabel, pickCanonicalAtom } from "./graphql";

export async function resolveAtomTermIdForLabel(params: {
  networkConfig: IntuitionNetworkConfig;
  writeConfig: WriteConfig;
  label: string;
  description?: string;
}): Promise<{ termId: Hex; created: boolean; txHash?: Hex }> {
  const name = params.label.trim();
  if (!name) throw new Error("Atom label is empty");

  const rows = await findAtomsByLabel(params.networkConfig, name);
  const canonical = pickCanonicalAtom(rows);
  if (canonical) {
    return { termId: canonical.term_id as Hex, created: false };
  }

  const created = await ensureAtomFromLabel({
    name,
    description: params.description ?? `Workshop semantic atom: ${name}`,
    writeConfig: params.writeConfig,
  });

  return {
    termId: created.termId,
    created: created.created,
    txHash: created.txHash,
  };
}
