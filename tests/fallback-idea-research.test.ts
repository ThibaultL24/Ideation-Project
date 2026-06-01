// tests/fallback-idea-research.test.ts
import { describe, expect, it } from "vitest";
import { buildFallbackDeepResearch } from "@/lib/assist/fallback-idea-research";

describe("fallback deep research", () => {
  it("returns dense cultural GPS report", () => {
    const report = buildFallbackDeepResearch({
      prompt:
        "j'aimerai créer une app culturelle, un gps historique qui afficherait le tracé de la vie des gens",
      ideaTitle: "GPS Historique",
      catalogMatches: [],
      githubIssues: [],
    });

    expect(report.diagnostic.summary.length).toBeGreaterThan(200);
    expect(report.improvements.length).toBeGreaterThanOrEqual(12);
    expect(report.diagnostic.strengths.length).toBeGreaterThanOrEqual(5);
    expect(report.proposedBrief.problem.length).toBeGreaterThan(100);
    expect(report.proposedBrief.title).toBe("GPS Historique");
  });
});
