// tests/research-schema-repair.test.ts
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { normalizeRawResearchResponse } from "@/lib/assist/normalize-research-response";

const researchSchema = z.object({
  relatedIdeas: z
    .array(
      z.object({
        title: z.string(),
        pitch: z.string().min(20),
        angle: z.string(),
      }),
    )
    .min(2),
});

describe("research schema repair", () => {
  it("pads short relatedIdeas pitches so Zod accepts OpenAI-shaped JSON", () => {
    const normalized = normalizeRawResearchResponse(
      {
        headline: "Cinema app",
        relatedIdeas: [
          { title: "B2B", pitch: "For theaters", angle: "B2B" },
          { title: "API", pitch: "Embed routes", angle: "Platform" },
        ],
      },
      {
        prompt: "cinema cultural app",
        ideaTitle: "Cinema Atlas",
        catalogMatches: [],
        githubIssues: [],
      },
    );

    expect(() => researchSchema.parse(normalized)).not.toThrow();
  });
});
