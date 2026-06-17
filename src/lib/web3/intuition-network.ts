// src/lib/web3/intuition-network.ts
import { intuitionMainnet, intuitionTestnet } from "@0xintuition/protocol";
import type { Chain } from "viem";

export type IntuitionNetworkId = "testnet" | "mainnet";

/** Default: testnet (tTRUST, chain 13579). Set `NEXT_PUBLIC_INTUITION_NETWORK=mainnet` for production. */
export function resolveIntuitionNetwork(): IntuitionNetworkId {
  const env =
    process.env.NEXT_PUBLIC_INTUITION_NETWORK ?? process.env.INTUITION_NETWORK;
  return env === "mainnet" ? "mainnet" : "testnet";
}

function resolveIntuitionRpcUrl(baseChain: Chain): string {
  const custom =
    process.env.NEXT_PUBLIC_INTUITION_RPC_URL ??
    process.env.INTUITION_RPC_URL ??
    null;
  if (typeof custom === "string" && custom.length > 0) {
    return custom;
  }
  return baseChain.rpcUrls.default.http[0];
}

function chainWithRpc(baseChain: Chain, rpcUrl: string): Chain {
  if (rpcUrl === baseChain.rpcUrls.default.http[0]) {
    return baseChain;
  }
  return {
    ...baseChain,
    rpcUrls: {
      ...baseChain.rpcUrls,
      default: {
        http: [rpcUrl],
        webSocket: baseChain.rpcUrls.default.webSocket,
      },
    },
  };
}

export function intuitionChainForNetwork(
  network: IntuitionNetworkId = resolveIntuitionNetwork(),
): Chain {
  const base = network === "mainnet" ? intuitionMainnet : intuitionTestnet;
  return chainWithRpc(base, resolveIntuitionRpcUrl(base));
}

/** Chain used by wagmi and @0xintuition/sdk. */
export const INTUITION_TARGET_CHAIN = intuitionChainForNetwork();

export const INTUITION_NETWORK_HUB_URL =
  resolveIntuitionNetwork() === "mainnet"
    ? "https://hub.intuition.systems/"
    : "https://testnet.hub.intuition.systems/";

export const intuitionNetworkLabel =
  resolveIntuitionNetwork() === "mainnet"
    ? "Intuition mainnet"
    : "Intuition testnet";
