import { describe, expect, it } from "vitest";
import {
  NEARBY_MATCH_SCORE,
  STRONG_MATCH_SCORE,
  tokenizePrompt,
} from "@/lib/ideas/brainstorm-similarity";

describe("brainstorm-similarity", () => {
  it("tokenizes french prompts", () => {
    const tokens = tokenizePrompt("Je veux créer une app de réputation");
    expect(tokens).toContain("reputation");
    expect(tokens).not.toContain("veux");
  });

  it("defines nearby and strong match thresholds", () => {
    expect(NEARBY_MATCH_SCORE).toBeGreaterThanOrEqual(3);
    expect(STRONG_MATCH_SCORE).toBeGreaterThan(NEARBY_MATCH_SCORE);
  });
});
