// tests/parser.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseIdeasFromText } from "@/lib/ideas/parser";

const SAMPLE = `
1. Reviews & Ratings (28 ideas)
Short category intro.
1. StakeReview — Universal product review layer. (Like: Amazon Reviews)
2. FilmStake — Movie ratings. (Like: Rotten Tomatoes)

2. Identity, Reputation & Credentials (25 ideas)
1. TrustScore — Universal on-chain reputation score. (Like: FICO score)
`;

describe("parseIdeasFromText", () => {
  it("parses ideas with category, description, and comparable", () => {
    const ideas = parseIdeasFromText(SAMPLE);
    expect(ideas).toHaveLength(3);
    expect(ideas[0]?.title).toBe("StakeReview");
    expect(ideas[0]?.category).toBe("Reviews & Ratings");
    expect(ideas[0]?.comparable).toBe("Amazon Reviews");
    expect(ideas[2]?.title).toBe("TrustScore");
  });

  it("parses the full 300+ ideas document", () => {
    const raw = readFileSync(
      path.join(process.cwd(), "data/raw/ideas.txt"),
      "utf8",
    );
    const ideas = parseIdeasFromText(raw);
    expect(ideas.length).toBeGreaterThanOrEqual(300);
    expect(new Set(ideas.map((i) => i.title)).size).toBe(ideas.length);
  });
});
