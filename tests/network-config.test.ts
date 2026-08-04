// tests/network-config.test.ts
import { afterEach, describe, expect, it } from "vitest";
import {
  getExplorerUrl,
  getNetworkConfig,
  getPortalExplorerUrl,
  networkExplorerAtomUrl,
} from "@/lib/intuition/config";

const ENV_KEYS = [
  "INTUITION_NETWORK",
  "NEXT_PUBLIC_INTUITION_NETWORK",
  "INTUITION_RPC_URL",
  "NEXT_PUBLIC_INTUITION_RPC_URL",
] as const;

function withNetwork(network: "mainnet" | "testnet", run: () => void) {
  const saved = Object.fromEntries(
    ENV_KEYS.map((key) => [key, process.env[key]]),
  ) as Record<(typeof ENV_KEYS)[number], string | undefined>;
  for (const key of ENV_KEYS) delete process.env[key];
  process.env.INTUITION_NETWORK = network;
  try {
    run();
  } finally {
    for (const key of ENV_KEYS) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe("getNetworkConfig explorer URLs", () => {
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it("uses testnet explorer when INTUITION_NETWORK=testnet", () => {
    withNetwork("testnet", () => {
      const config = getNetworkConfig();
      expect(config.network).toBe("testnet");
      expect(config.explorer).toBe("https://testnet.explorer.intuition.systems");
      expect(getExplorerUrl()).toBe(config.explorer);
      expect(getPortalExplorerUrl()).toBe(
        "https://testnet.portal.intuition.systems/explore/home",
      );
      expect(networkExplorerAtomUrl("0xabc")).toBe(
        "https://testnet.portal.intuition.systems/explore/atom/0xabc",
      );
    });
  });

  it("uses mainnet portal atom URL when INTUITION_NETWORK=mainnet", () => {
    withNetwork("mainnet", () => {
      const config = getNetworkConfig();
      expect(config.network).toBe("mainnet");
      expect(config.explorer).toBe("https://explorer.intuition.systems");
      expect(getExplorerUrl()).toBe(config.explorer);
      expect(getPortalExplorerUrl()).toBe(
        "https://portal.intuition.systems/explore/home",
      );
      expect(networkExplorerAtomUrl("0xabc")).toBe(
        "https://portal.intuition.systems/explore/atom/0xabc",
      );
    });
  });
});
