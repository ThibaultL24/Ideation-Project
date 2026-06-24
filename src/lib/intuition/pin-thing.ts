// src/lib/intuition/pin-thing.ts
import type { PinThingMutationVariables } from "@0xintuition/graphql";
import { getNetworkConfig, type IntuitionNetworkConfig } from "./config";
import { pinThing } from "./graphql";

function toPinInput(thing: PinThingMutationVariables) {
  return {
    name: thing.name,
    description: thing.description ?? "",
    image: thing.image ?? "",
    url: thing.url ?? "",
  };
}

/**
 * Pin structured atom metadata to IPFS before an on-chain write.
 * Mainnet GraphQL is read-only (no `pinThing` mutation); we pin via testnet
 * because IPFS URIs — and thus atom term IDs — are chain-agnostic.
 */
export async function pinThingForNetwork(
  networkConfig: IntuitionNetworkConfig,
  input: PinThingMutationVariables,
): Promise<string> {
  const payload = toPinInput(input);
  if (networkConfig.network === "mainnet") {
    return pinThing(getNetworkConfig("testnet"), payload);
  }
  return pinThing(networkConfig, payload);
}
