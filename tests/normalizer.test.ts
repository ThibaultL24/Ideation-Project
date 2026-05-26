// tests/normalizer.test.ts
import { describe, expect, it } from "vitest";
import { normalizeIdea } from "@/lib/ideas/normalizer";

describe("normalizeIdea", () => {
  it("builds canonical id and tagline", () => {
    const idea = normalizeIdea({
      title: "StakeReview",
      description:
        "Universal product review layer where consumers stake $TRUST. Early reviewers earn returns.",
      category: "Reviews & Ratings",
      categoryIndex: 1,
      ideaIndex: 1,
    });
    expect(idea.canonicalId).toBe("idea-01-001-stake-review");
    expect(idea.slug).toBe("stake-review");
    expect(idea.tagline.length).toBeGreaterThan(10);
    expect(idea.tags).toContain("reviews-ratings");
  });
});
