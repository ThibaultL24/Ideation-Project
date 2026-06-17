// src/lib/web3/wagmi-config.ts
import { createConfig, http, injected } from "wagmi";
import { INTUITION_TARGET_CHAIN } from "@/lib/web3/intuition-network";

const intuitionRpc = INTUITION_TARGET_CHAIN.rpcUrls.default.http[0];

/** Injected connectors only — avoids pulling the full @wagmi/connectors barrel (porto/tempo/safe). */
const connectors = [
  injected({ target: "metaMask" }),
  injected({ target: "okxWallet" }),
  injected({ target: "bitKeep" }),
  injected({ target: "coinbaseWallet" }),
  injected(),
];

export const wagmiConfig = createConfig({
  chains: [INTUITION_TARGET_CHAIN],
  connectors,
  transports: {
    [INTUITION_TARGET_CHAIN.id]: http(intuitionRpc),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
