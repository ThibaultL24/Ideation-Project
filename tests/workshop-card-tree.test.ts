// tests/workshop-card-tree.test.ts
import { describe, expect, it } from "vitest";
import {
  buildRefinementSummary,
  getLevelAfterPicks,
  isRefinementComplete,
  MAX_CARD_DEPTH,
} from "@/lib/workshop/card-tree";

describe("card-tree", () => {
  it("starts at root with 4 cards", () => {
    const level = getLevelAfterPicks([]);
    expect(level?.id).toBe("root");
    expect(level?.cards).toHaveLength(4);
  });

  it("completes after three picks", () => {
    const picks = [
      { levelId: "root", cardId: "reputation", title: "Réputation" },
      { levelId: "reputation-focus", cardId: "people", title: "Personnes" },
      { levelId: "people-mechanism", cardId: "stake-reviews", title: "Avis stakés" },
    ];
    expect(isRefinementComplete(picks)).toBe(true);
    expect(getLevelAfterPicks(picks)).toBeNull();
  });

  it("uses generic level 3 when no specific branch", () => {
    const picks = [
      { levelId: "root", cardId: "curation", title: "Liste curée" },
      { levelId: "curation-focus", cardId: "orgs", title: "Organisations" },
    ];
    const level = getLevelAfterPicks(picks);
    expect(level?.id).toBe("generic-mechanism");
    expect(level?.cards).toHaveLength(4);
  });

  it("builds refinement summary", () => {
    const summary = buildRefinementSummary("Mon idée IA", [
      { levelId: "root", cardId: "signal", title: "Signal" },
    ]);
    expect(summary).toContain("Mon idée IA");
    expect(summary).toContain("Signal");
  });

  it("max depth is 3", () => {
    expect(MAX_CARD_DEPTH).toBe(3);
  });
});
