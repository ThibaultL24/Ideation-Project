// src/lib/intuition/config.ts
import {
  getMultiVaultAddressFromChainId,
  intuitionMainnet,
  intuitionTestnet,
} from "@0xintuition/protocol";
import {
  readIntuitionNetworkEnv,
  readIntuitionRpcOverride,
  type IntuitionNetwork,
} from "@/lib/env/network";

export type { IntuitionNetwork };

export interface IntuitionNetworkConfig {
  network: IntuitionNetwork;
  chainId: number;
  rpc: string;
  graphql: string;
  explorer: string;
  portal: string;
  hub: string;
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
    portal: "https://portal.intuition.systems/explore/home",
    hub: "https://hub.intuition.systems/",
    multivault: getMultiVaultAddressFromChainId(intuitionMainnet.id),
    nativeSymbol: "TRUST",
  },
  testnet: {
    network: "testnet",
    chainId: 13579,
    rpc: "https://testnet.rpc.intuition.systems/http",
    graphql: "https://testnet.intuition.sh/v1/graphql",
    explorer: "https://testnet.explorer.intuition.systems",
    portal: "https://testnet.portal.intuition.systems/explore/home",
    hub: "https://testnet.hub.intuition.systems/",
    multivault: getMultiVaultAddressFromChainId(intuitionTestnet.id),
    nativeSymbol: "tTRUST",
  },
};

/** @deprecated Prefer readIntuitionNetworkEnv from @/lib/env/network */
export function resolveNetwork(): IntuitionNetwork {
  return readIntuitionNetworkEnv();
}

export function getNetworkConfig(
  network = readIntuitionNetworkEnv(),
): IntuitionNetworkConfig {
  const base = CONFIG[network];
  const rpcOverride = readIntuitionRpcOverride();
  if (!rpcOverride) return base;
  return { ...base, rpc: rpcOverride };
}

export function getNetworkLabel(network = readIntuitionNetworkEnv()): string {
  return network === "mainnet" ? "Intuition mainnet" : "Intuition testnet";
}

export const MAINNET_INTUITION_PROTOCOL_TERM_ID =
  "0xda797f4aa19c2b129bd3a33cdb8d260b94672fcdb295d04e2533dc02a994a3d8" as const;

export const IDEA_PREDICATE_LABEL = "top project ideas for";

export const BOUNTY_PREDICATE_LABEL = IDEA_PREDICATE_LABEL;

/** Canonical triple object label (aligned with resolveObjectTermId / migration 3A). */
export const INTUITION_PROTOCOL_OBJECT_LABEL = "Intuition Protocol";

export function getPortalExplorerUrl(
  network = readIntuitionNetworkEnv(),
): string {
  return getNetworkConfig(network).portal;
}

export function getExplorerUrl(
  network = readIntuitionNetworkEnv(),
): string {
  return getNetworkConfig(network).explorer;
}

export function networkExplorerAtomUrl(
  termId: string,
  network = readIntuitionNetworkEnv(),
): string {
  return `${getExplorerUrl(network)}/atom/${termId}`;
}
