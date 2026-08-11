// src/lib/intuition/pinata-pin.ts
import type { PinThingInput } from "./graphql";

const PINATA_PIN_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

export function getPinataJwt(): string | undefined {
  return (
    process.env["PINATA_JWT"]?.trim() ||
    process.env["PINATA_API_JWT"]?.trim() ||
    undefined
  );
}

/**
 * Pin Thing-shaped JSON via Pinata (fallback when INTUITION_PIN_API_KEY is unset).
 * Returns ipfs://… suitable for createAtoms / calculateAtomId.
 */
export async function pinThingWithPinata(input: PinThingInput): Promise<string> {
  const jwt = getPinataJwt();
  if (!jwt) {
    throw new Error(
      "Missing PINATA_JWT (or PINATA_API_JWT) — add a Pinata JWT in Coolify for temporary IPFS pinning.",
    );
  }

  const content = {
    "@context": "https://schema.org",
    "@type": "Thing",
    name: input.name,
    description: input.description,
    image: input.image ?? "",
    url: input.url ?? "",
  };

  const response = await fetch(PINATA_PIN_JSON_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      pinataContent: content,
      pinataMetadata: {
        name: `ideation-${input.name}`.slice(0, 100),
      },
    }),
  });

  const json = (await response.json()) as {
    IpfsHash?: string;
    error?: { reason?: string; details?: string } | string;
    message?: string;
  };

  if (!response.ok) {
    const detail =
      typeof json.error === "string"
        ? json.error
        : json.error?.details || json.error?.reason || json.message || response.statusText;
    throw new Error(`Pinata pin failed: ${detail}`);
  }

  const hash = json.IpfsHash?.trim();
  if (!hash) throw new Error("Pinata returned no IpfsHash");
  return `ipfs://${hash}`;
}
