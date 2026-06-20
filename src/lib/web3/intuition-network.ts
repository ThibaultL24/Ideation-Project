// src/lib/web3/intuition-network.ts
import { intuitionMainnet, intuitionTestnet } from "@0xintuition/protocol";
import type { Chain } from "viem";
import {
  getNetworkConfig,
  getNetworkLabel,
  resolveNetwork,
} from "@/lib/intuition/config";

export type IntuitionNetworkId = "testnet" | "mainnet";

/** Wallet / wagmi network — follows INTUITION_NETWORK (see .env.example). */
export function resolveIntuitionNetwork(): IntuitionNetworkId {
  return resolveNetwork();
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
  const { rpc } = getNetworkConfig(network);
  return chainWithRpc(base, rpc);
}

/** Chain used by wagmi and @0xintuition/sdk. */
export const INTUITION_TARGET_CHAIN = intuitionChainForNetwork();

export const INTUITION_NETWORK_HUB_URL =
  getNetworkConfig().hub;

export const intuitionNetworkLabel = getNetworkLabel();
