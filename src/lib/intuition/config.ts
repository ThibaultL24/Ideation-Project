// src/lib/intuition/config.ts
import {
  getMultiVaultAddressFromChainId,
  intuitionMainnet,
  intuitionTestnet,
} from "@0xintuition/protocol";

export type IntuitionNetwork = "mainnet" | "testnet";

export interface IntuitionNetworkConfig {
  network: IntuitionNetwork;
  chainId: number;
  rpc: string;
  graphql: string;
  explorer: string;
  multivault: `0x${string}`;
  nativeSymbol: string;
}

const CONFIG: Record<IntuitionNetwork, IntuitionNetworkConfig> = {
  mainnet: {
    network: "mainnet",
    chainId: 1155,
    rpc: "https://rpc.intuition.systems/http",
    graphql: "https://mainnet.intuition.sh/v1/graphql",
    explorer: "https://explorer.intuition.systems",
    multivault: getMultiVaultAddressFromChainId(intuitionMainnet.id),
    nativeSymbol: "TRUST",
  },
  testnet: {
    network: "testnet",
    chainId: 13579,
    rpc: "https://testnet.rpc.intuition.systems/http",
    graphql: "https://testnet.intuition.sh/v1/graphql",
    explorer: "https://testnet.explorer.intuition.systems",
    multivault: getMultiVaultAddressFromChainId(intuitionTestnet.id),
    nativeSymbol: "tTRUST",
  },
};

export function resolveNetwork(): IntuitionNetwork {
  const raw = process.env["INTUITION_NETWORK"]?.trim().toLowerCase();
  return raw === "mainnet" ? "mainnet" : "testnet";
}

export function getNetworkConfig(
  network = resolveNetwork(),
): IntuitionNetworkConfig {
  return CONFIG[network];
}

export const MAINNET_INTUITION_PROTOCOL_TERM_ID =
  "0xda797f4aa19c2b129bd3a33cdb8d260b94672fcdb295d04e2533dc02a994a3d8" as const;

export const IDEA_PREDICATE_LABEL = "top project ideas for";

export const BOUNTY_PREDICATE_LABEL = IDEA_PREDICATE_LABEL;
