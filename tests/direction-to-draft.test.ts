// tests/direction-to-draft.test.ts
import { describe, expect, it } from "vitest";
import { directionToBrainstormDraft } from "@/lib/ideas/direction-to-draft";
import type { BrainstormDirection } from "@/lib/workshop/brainstorm";

const sample: BrainstormDirection = {
  id: "d1",
  title: "TrustLens",
  tagline: "Reviews you can stake on",
  angle: "reputation system",
  problemHook: "Buyers cannot tell which reviews are honest onchain marketplaces.",
  intuitionFit: "Stake TRUST on review atoms and surface signal in the graph.",
  mvpSketch: "Three screens: list, review, stake.",
  whyInteresting: "Cold start is the main risk.",
  risks: ["Sybil reviews", "Low liquidity"],
};

describe("directionToBrainstormDraft", () => {
  it("maps direction fields into bounty BrainstormDraft", () => {
    const draft = directionToBrainstormDraft(sample);
    expect(draft.archetype).toBe("reputation");
    expect(draft.problem).toContain("honest");
    expect(draft.intuitionFit).toContain("Stake TRUST");
    expect(draft.mvp).toContain("Three screens");
    expect(draft.risks).toContain("Sybil reviews");
  });
});
