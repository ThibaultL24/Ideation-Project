// src/lib/intuition/atoms.ts
import {
  calculateAtomId,
  createAtomFromIpfsUri,
  createAtomFromThing,
  pinThing,
} from "@0xintuition/sdk";
import { multiVaultIsTermCreated, type WriteConfig } from "@0xintuition/protocol";
import { toHex, type Hex } from "viem";
import type { PinThingMutationVariables } from "@0xintuition/graphql";
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import type { Idea } from "@/lib/ideas/schema";
import { ideaToPinThing, labelToPinThing } from "./idea-thing";

export interface EnsureAtomResult {
  termId: Hex;
  ipfsUri: string;
  created: boolean;
  txHash?: Hex;
}

async function resolveIpfsUri(
  thing: PinThingMutationVariables,
): Promise<string> {
  const uri = await pinThing(thing);
  if (!uri?.startsWith("ipfs://")) {
    throw new Error(`pinThing failed for "${thing.name}"`);
  }
  return uri;
}

export async function ensureAtomFromThing(params: {
  thing: PinThingMutationVariables;
  writeConfig: WriteConfig;
  depositWei?: bigint;
}): Promise<EnsureAtomResult> {
  const { thing, writeConfig, depositWei } = params;
  const ipfsUri = await resolveIpfsUri(thing);
  const termId = calculateAtomId(toHex(ipfsUri)) as Hex;

  const exists = await multiVaultIsTermCreated(writeConfig, { args: [termId] });
  if (exists) {
    return { termId, ipfsUri, created: false };
  }

  const result = await createAtomFromIpfsUri(
    writeConfig,
    ipfsUri as `ipfs://${string}`,
    depositWei,
  );

  return {
    termId: result.state.termId as Hex,
    ipfsUri: result.uri,
    created: true,
    txHash: result.transactionHash,
  };
}

export async function ensureAtomFromIdea(params: {
  idea: Idea;
  writeConfig: WriteConfig;
  githubBlobUrl?: string;
  draft?: Partial<BrainstormDraft> | null;
  depositWei?: bigint;
}): Promise<EnsureAtomResult> {
  return ensureAtomFromThing({
    thing: ideaToPinThing(params.idea, params.githubBlobUrl, params.draft),
    writeConfig: params.writeConfig,
    depositWei: params.depositWei,
  });
}

export async function ensureAtomFromLabel(params: {
  name: string;
  description: string;
  writeConfig: WriteConfig;
  depositWei?: bigint;
}): Promise<EnsureAtomResult> {
  return ensureAtomFromThing({
    thing: labelToPinThing(params.name, params.description),
    writeConfig: params.writeConfig,
    depositWei: params.depositWei,
  });
}

/** Create atom in one SDK call (pin + create). Use only when existence is unknown. */
export async function createAtomFromThingFresh(params: {
  thing: PinThingMutationVariables;
  writeConfig: WriteConfig;
  depositWei?: bigint;
}): Promise<EnsureAtomResult> {
  const result = await createAtomFromThing(
    params.writeConfig,
    params.thing,
    params.depositWei,
  );
  return {
    termId: result.state.termId as Hex,
    ipfsUri: result.uri,
    created: true,
    txHash: result.transactionHash,
  };
}
