// src/lib/intuition/pin-thing.ts
import type { PinThingMutationVariables } from "@0xintuition/graphql";
import type { IntuitionNetworkConfig } from "./config";
import { getIntuitionPinApiKey, pinThingWithIntuitionApi } from "./graphql";
import { getPinataJwt, pinThingWithPinata } from "./pinata-pin";

function toPinInput(thing: PinThingMutationVariables) {
  return {
    name: thing.name,
    description: thing.description ?? "",
    image: thing.image ?? "",
    url: thing.url ?? "",
  };
}

export type PinBackend = "intuition" | "pinata";

export function resolvePinBackend(): PinBackend | null {
  if (getIntuitionPinApiKey()) return "intuition";
  if (getPinataJwt()) return "pinata";
  return null;
}

/**
 * Pin structured atom metadata to IPFS before an on-chain write.
 * Prefers Intuition pin API; falls back to Pinata JWT for demos.
 */
export async function pinThingForNetwork(
  _networkConfig: IntuitionNetworkConfig,
  input: PinThingMutationVariables,
): Promise<string> {
  const payload = toPinInput(input);
  const backend = resolvePinBackend();

  if (backend === "intuition") {
    return pinThingWithIntuitionApi(payload);
  }
  if (backend === "pinata") {
    return pinThingWithPinata(payload);
  }

  throw new Error(
    "No IPFS pin credential — set INTUITION_PIN_API_KEY or PINATA_JWT in Coolify (server secrets).",
  );
}
