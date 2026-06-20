import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function readNetwork(): "mainnet" | "testnet" {
  const raw =
    process.env["INTUITION_NETWORK"] ??
    process.env["NEXT_PUBLIC_INTUITION_NETWORK"];
  return raw?.trim().toLowerCase() === "mainnet" ? "mainnet" : "testnet";
}

const RPC_PRESETS = {
  mainnet: "https://rpc.intuition.systems/http",
  testnet: "https://testnet.rpc.intuition.systems/http",
} as const;

const resolvedNetwork = readNetwork();

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  // Mirror INTUITION_NETWORK to the browser bundle when NEXT_PUBLIC_* is omitted.
  env: {
    NEXT_PUBLIC_INTUITION_NETWORK:
      process.env["NEXT_PUBLIC_INTUITION_NETWORK"] ?? resolvedNetwork,
    NEXT_PUBLIC_INTUITION_RPC_URL:
      process.env["NEXT_PUBLIC_INTUITION_RPC_URL"] ??
      process.env["INTUITION_RPC_URL"] ??
      RPC_PRESETS[resolvedNetwork],
  },
};

export default nextConfig;
