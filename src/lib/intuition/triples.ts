// src/lib/intuition/triples.ts
import { calculateTripleId, createTripleStatement } from "@0xintuition/sdk";
import { multiVaultGetTripleCost, multiVaultIsTermCreated, type WriteConfig } from "@0xintuition/protocol";
import type { Hex } from "viem";

export interface EnsureTripleResult {
  tripleTermId: Hex;
  created: boolean;
  txHash?: Hex;
}

export async function ensureTriple(params: {
  subjectId: Hex;
  predicateId: Hex;
  objectId: Hex;
  writeConfig: WriteConfig;
  depositWei?: bigint;
}): Promise<EnsureTripleResult> {
  const { subjectId, predicateId, objectId, writeConfig, depositWei = BigInt(0) } =
    params;

  const tripleTermId = calculateTripleId(
    subjectId,
    predicateId,
    objectId,
  ) as Hex;

  const exists = await multiVaultIsTermCreated(writeConfig, {
    args: [tripleTermId],
  });
  if (exists) {
    return { tripleTermId, created: false };
  }

  const tripleCost = await multiVaultGetTripleCost(writeConfig);
  const assets = tripleCost + depositWei;

  const result = await createTripleStatement(writeConfig, {
    args: [[subjectId], [predicateId], [objectId], [assets]],
    value: assets,
  });

  return {
    tripleTermId,
    created: true,
    txHash: result.transactionHash,
  };
}
