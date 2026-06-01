// tests/decent-rep.test.ts
import { describe, expect, it } from "vitest";
import { summarizeOnchainPublish } from "@/lib/workshop/decent-rep";
import type { WorkshopPublishResult } from "@/lib/intuition/publish-workshop";

describe("decent-rep", () => {
  it("summarizes publish result for session storage", () => {
    const result: WorkshopPublishResult = {
      ideaCanonicalId: "workshop-ws_x",
      network: "testnet",
      ideaAtomId: "0xabc" as `0x${string}`,
      ideaAtomCreated: true,
      predicateAtomId: "0xdef" as `0x${string}`,
      objectAtomId: "0x111" as `0x${string}`,
      tripleTermId: "0xtriple" as `0x${string}`,
      tripleCreated: true,
      supportTriples: [],
      atomsPublished: [],
      skipped: [],
      txHashes: ["0xtx" as `0x${string}`],
      graphqlVerified: true,
      estimatedCostWei: "1000",
    };
    const summary = summarizeOnchainPublish(result);
    expect(summary.ideaAtomId).toBe("0xabc");
    expect(summary.txCount).toBe(1);
    expect(summary.portalHome).toContain("testnet");
  });
});
