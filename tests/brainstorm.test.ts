// tests/brainstorm.test.ts
import { describe, expect, it } from "vitest";
import { buildFallbackBrainstorm } from "@/lib/assist/fallback-brainstorm";
import { directionToRefinedIntent } from "@/lib/workshop/brainstorm";

describe("brainstorm", () => {
  it("builds five fallback directions for vague cinema exploration", () => {
    const report = buildFallbackBrainstorm({
      explorationPrompt: "je cherche quelque chose autour du cinéma et la culture",
      prompt: "je cherche quelque chose autour du cinéma et la culture",
      ideaTitle: "Cinema Explore",
      catalogMatches: [
        {
          canonicalId: "x",
          slug: "cultural-curator",
          title: "CulturalCurator",
          tagline: "Museums",
          category: "Culture",
          score: 3,
          matchReason: "cultural",
        },
      ],
      githubIssues: [],
    });
    expect(report.directions).toHaveLength(5);
    expect(report.territory.length).toBeGreaterThan(40);
    expect(report.clarifyingQuestions.length).toBeGreaterThanOrEqual(4);
  });

  it("merges exploration + direction into refined intent", () => {
    const text = directionToRefinedIntent("explore cinema trust", {
      id: "direction-1",
      title: "CinemaScope",
      tagline: "Staked cinema picks",
      angle: "Consumer",
      problemHook: "Reviews are gamed.",
      intuitionFit: "Stake on picks.",
      mvpSketch: "One city pilot.",
      whyInteresting: "Fresh wedge.",
      risks: ["Cold start"],
    });
    expect(text).toContain("CinemaScope");
    expect(text).toContain("explore cinema trust");
  });
});
