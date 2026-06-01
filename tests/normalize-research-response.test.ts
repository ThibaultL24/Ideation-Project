// tests/normalize-research-response.test.ts
import { describe, expect, it } from "vitest";
import { normalizeRawResearchResponse } from "@/lib/assist/normalize-research-response";

describe("normalizeRawResearchResponse", () => {
  it("coerces malformed OpenAI shapes", () => {
    const out = normalizeRawResearchResponse(
      {
        headline: "Cinema trust app",
        relatedIdeas: [{ name: "B2B", description: "For theaters" }],
        proposedBrief: {
          title: "Cinelma",
          targetUsers: ["students", "critics"],
          mvpScope: ["one city", "5 venues"],
        },
      },
      {
        prompt: "cultural app around cinema",
        ideaTitle: "Cinelma",
        catalogMatches: [
          {
            title: "CulturalCurator",
            slug: "cultural-curator",
            tagline: "Museums",
            matchReason: "cultural",
            score: 5,
          },
        ],
        githubIssues: [],
      },
    );

    expect(Array.isArray(out.similarIdeas)).toBe(true);
    expect((out.similarIdeas as unknown[]).length).toBeGreaterThan(0);
    expect((out.relatedIdeas as unknown[]).length).toBeGreaterThanOrEqual(4);
    const first = (out.relatedIdeas as Array<{ pitch: string }>)[0];
    expect(first.pitch.length).toBeGreaterThanOrEqual(20);
    const brief = out.proposedBrief as Record<string, unknown>;
    expect(typeof brief.targetUsers).toBe("string");
    expect(typeof brief.mvpScope).toBe("string");
  });
});
