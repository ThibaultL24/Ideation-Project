// tests/pick-refinement.test.ts
import { describe, expect, it } from "vitest";
import { refinePick } from "../src/lib/ideas/pick-refinement";

describe("refinePick", () => {
  it("returns AI-related cards for IA intent", async () => {
    const result = await refinePick({
      intent: "je veux créer une app sur l'ia et les agents",
      answers: [],
    });
    expect(result.matchCount).toBeGreaterThan(0);
    expect(result.cards.length).toBeGreaterThan(0);
    const hasAi = result.cards.some(
      (c) =>
        c.category.includes("AI") ||
        c.title.toLowerCase().includes("agent") ||
        c.tagline.toLowerCase().includes("ai"),
    );
    expect(hasAi).toBe(true);
  });

  it("narrows after archetype answer", async () => {
    const first = await refinePick({
      intent: "application intelligence artificielle",
      answers: [],
    });
    const second = await refinePick({
      intent: "application intelligence artificielle",
      answers: [{ questionId: "archetype", choiceId: "agents" }],
    });
    expect(second.filters.archetype).toBe("agents");
    expect(second.matchCount).toBeLessThanOrEqual(first.matchCount);
  });
});
