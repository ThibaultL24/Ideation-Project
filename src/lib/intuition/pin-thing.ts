// src/lib/intuition/pin-thing.ts
import type { PinThingMutationVariables } from "@0xintuition/graphql";
import type { IntuitionNetworkConfig } from "./config";
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
 * Uses https://pin.intuition.systems (INTUITION_PIN_API_KEY) — read GraphQL
 * endpoints are mutation-free; IPFS URIs are chain-agnostic.
 */
export async function pinThingForNetwork(
  networkConfig: IntuitionNetworkConfig,
  input: PinThingMutationVariables,
): Promise<string> {
  return pinThing(networkConfig, toPinInput(input));
}
