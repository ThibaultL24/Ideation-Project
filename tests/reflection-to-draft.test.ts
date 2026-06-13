// tests/reflection-to-draft.test.ts
import { describe, expect, it } from "vitest";
import { reflectionToBrainstormDraft } from "@/lib/ideas/reflection-to-draft";
import type { IdeaReflectionReport } from "@/lib/ideas/idea-reflection";

const sample: IdeaReflectionReport = {
  headline: "TrustLens",
  reflection: "A focused reflection on the selected idea.",
  strengths: ["Clear problem"],
  weaknesses: ["Cold start"],
  problem: "Buyers cannot trust reviews.",
  solution: "Stake on review quality.",
  users: "Marketplace buyers on testnet.",
  intuitionFit: "Review atoms with TRUST staking.",
  mvp: "List, review, stake.",
  risks: ["Sybil", "Low liquidity"],
  challenge: "Prove staking beats stars.",
  archetype: "reputation",
  ecosystemNote: "Similar ideas exist in catalog.",
  generatedAt: new Date().toISOString(),
};

describe("reflectionToBrainstormDraft", () => {
  it("maps reflection fields into bounty BrainstormDraft", () => {
    const draft = reflectionToBrainstormDraft(sample);
    expect(draft.archetype).toBe("reputation");
    expect(draft.problem).toContain("reviews");
    expect(draft.risks).toContain("Sybil");
    expect(draft.supportTriples).toBe("");
  });
});
