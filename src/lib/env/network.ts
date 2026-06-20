// src/lib/env/network.ts
/**
 * Single network switch for server, wallet, GraphQL, and scripts.
 * Set INTUITION_NETWORK=mainnet|testnet — see .env.example.
 */

export type IntuitionNetwork = "mainnet" | "testnet";

export function readIntuitionNetworkEnv(): IntuitionNetwork {
  const raw =
    process.env["INTUITION_NETWORK"] ??
    process.env["NEXT_PUBLIC_INTUITION_NETWORK"];
  return raw?.trim().toLowerCase() === "mainnet" ? "mainnet" : "testnet";
}

export function readIntuitionRpcOverride(): string | undefined {
  const custom =
    process.env["INTUITION_RPC_URL"] ??
    process.env["NEXT_PUBLIC_INTUITION_RPC_URL"];
  const trimmed = custom?.trim();
  return trimmed || undefined;
}

/** Resolved env snapshot for operators (`npm run env:check`). */
export function describeNetworkEnv() {
  const network = readIntuitionNetworkEnv();
  return {
    network,
    rpcOverride: readIntuitionRpcOverride() ?? null,
    hint:
      network === "mainnet"
        ? "Production — TRUST on chain 1155"
        : "Development — tTRUST on chain 13579",
  };
}
