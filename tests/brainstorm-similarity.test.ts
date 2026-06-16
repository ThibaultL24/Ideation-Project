import { describe, expect, it } from "vitest";
import {
  STRONG_MATCH_SCORE,
  tokenizePrompt,
} from "@/lib/ideas/brainstorm-similarity";

describe("brainstorm-similarity", () => {
  it("tokenizes french prompts", () => {
    const tokens = tokenizePrompt("Je veux créer une app de réputation");
    expect(tokens).toContain("reputation");
    expect(tokens).not.toContain("veux");
  });

  it("defines strong match threshold", () => {
    expect(STRONG_MATCH_SCORE).toBeGreaterThanOrEqual(6);
  });
});
