// tests/similar-catalog.test.ts
import { describe, expect, it } from "vitest";
import {
  NEARBY_MATCH_SCORE,
  rankCatalogByPrompt,
  tokenizePrompt,
} from "@/lib/ideas/brainstorm-similarity";
import { searchSimilarCatalog } from "@/lib/ideas/similar-catalog";
import { loadNormalizedIdeas } from "@/lib/ideas/load";

const HISTORICAL_MAP_INTENT =
  "An interactive map that traces the life of a historical figure. Users can follow their journeys, explore events linked to each location, and consult the sources supporting each piece of information.";

describe("similar catalog indicator", () => {
  it("drops english filler tokens from long intents", () => {
    const tokens = tokenizePrompt(HISTORICAL_MAP_INTENT);
    expect(tokens).toContain("historical");
    expect(tokens).toContain("map");
    expect(tokens).not.toContain("that");
    expect(tokens).not.toContain("users");
    expect(tokens).not.toContain("their");
    expect(tokens).not.toContain("each");
  });

  it("does not treat the full catalog as similar", async () => {
    const catalogSize = loadNormalizedIdeas().length;
    expect(catalogSize).toBeGreaterThan(100);

    const result = await searchSimilarCatalog(HISTORICAL_MAP_INTENT, 6);

    expect(result.matchCount).toBeGreaterThan(0);
    expect(result.matchCount).toBeLessThan(catalogSize);
    expect(result.matchCount).toBeLessThanOrEqual(40);
    expect(result.cards.length).toBeGreaterThan(0);
    expect(result.cards.length).toBeLessThanOrEqual(6);
    expect(result.cards.length).toBeLessThanOrEqual(result.matchCount);
  });

  it("only ranks ideas at or above the nearby threshold", () => {
    const ranked = rankCatalogByPrompt({
      prompt: HISTORICAL_MAP_INTENT,
      minScore: NEARBY_MATCH_SCORE,
    });
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.every((row) => row.score >= NEARBY_MATCH_SCORE)).toBe(true);
    expect(ranked[0]!.score).toBeGreaterThanOrEqual(ranked.at(-1)!.score);
  });
});
