// src/lib/web3/intuition-wallet-options.ts
import type { Connector } from "wagmi";

export interface IntuitionWalletOption {
  id: string;
  name: string;
  connectorKeys: string[];
  learnMoreUrl?: string;
}

/** Wallet list aligned with Intuition Portal. */
export const INTUITION_WALLET_OPTIONS: IntuitionWalletOption[] = [
  { id: "browser", name: "Browser Wallet", connectorKeys: ["injected", "browser wallet"] },
  { id: "rabby", name: "Rabby Wallet", connectorKeys: ["rabby", "rabby wallet"] },
  { id: "metaMask", name: "MetaMask", connectorKeys: ["metamask", "io.metamask"] },
  {
    id: "walletConnect",
    name: "WalletConnect",
    connectorKeys: ["walletconnect", "wallet connect"],
  },
  { id: "binance", name: "Binance Wallet", connectorKeys: ["binance", "bnb"] },
  { id: "okx", name: "OKX Wallet", connectorKeys: ["okx"] },
  { id: "bybit", name: "Bybit Wallet", connectorKeys: ["bybit"] },
  { id: "bitget", name: "Bitget Wallet", connectorKeys: ["bitget", "bitkeep"] },
];

export function resolveConnectorForOption(
  option: IntuitionWalletOption,
  connectors: readonly Connector[],
): Connector | undefined {
  const keys = option.connectorKeys.map((k) => k.toLowerCase());
  const direct = connectors.find((c) => {
    const hay = `${c.id} ${c.name} ${c.type}`.toLowerCase();
    return keys.some((k) => hay.includes(k));
  });
  if (direct) return direct;
  if (option.id === "walletConnect") return undefined;
  return connectors.find(
    (c) => c.type === "injected" || c.id.toLowerCase().includes("injected"),
  );
}
