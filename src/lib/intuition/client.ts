// src/lib/intuition/client.ts
import { intuitionMainnet, intuitionTestnet } from "@0xintuition/sdk";
import type { WriteConfig } from "@0xintuition/protocol";
import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  getNetworkConfig,
  type IntuitionNetwork,
  type IntuitionNetworkConfig,
} from "./config";
import { ensureSdkGraphqlClient } from "./sdk-setup";

export interface IntuitionClients {
  config: IntuitionNetworkConfig;
  networkConfig: IntuitionNetworkConfig;
  chain: Chain;
  publicClient: PublicClient;
  writeConfig?: WriteConfig;
  account?: Address;
  rpcUrl: string;
}

function chainForNetwork(network: IntuitionNetwork): Chain {
  return network === "mainnet" ? intuitionMainnet : intuitionTestnet;
}

export function loadPrivateKey(): Hex | undefined {
  const raw = process.env["INTUITION_PRIVATE_KEY"]?.trim();
  if (!raw) return undefined;
  if (!/^0x[0-9a-fA-F]{64}$/.test(raw)) {
    console.warn(
      "INTUITION_PRIVATE_KEY ignored: expected 32-byte hex (0x + 64 chars). Wallet features disabled.",
    );
    return undefined;
  }
  return raw as Hex;
}

export async function createIntuitionClients(
  network?: IntuitionNetwork,
): Promise<IntuitionClients> {
  const networkConfig = getNetworkConfig(network);
  ensureSdkGraphqlClient(networkConfig);
  const chain = chainForNetwork(networkConfig.network);
  const rpcUrl = process.env["INTUITION_RPC_URL"]?.trim() || networkConfig.rpc;

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const privateKey = loadPrivateKey();
  if (!privateKey) {
    return { config: networkConfig, networkConfig, chain, publicClient, rpcUrl };
  }

  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    chain,
    transport: http(rpcUrl),
    account,
  });

  const writeConfig: WriteConfig = {
    address: networkConfig.multivault,
    publicClient,
    walletClient,
  };

  return {
    config: networkConfig,
    networkConfig,
    chain,
    publicClient,
    writeConfig,
    account: account.address,
    rpcUrl,
  };
}

export async function getNativeBalance(
  clients: IntuitionClients,
): Promise<bigint> {
  if (!clients.account) return BigInt(0);
  return clients.publicClient.getBalance({ address: clients.account });
}
