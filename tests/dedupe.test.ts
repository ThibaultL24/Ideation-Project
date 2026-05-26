// tests/dedupe.test.ts
import { describe, expect, it } from "vitest";
import { dedupeIdeas } from "@/lib/ideas/dedupe";
import type { Idea } from "@/lib/ideas/schema";

function makeIdea(overrides: Partial<Idea> = {}): Idea {
  return {
    canonicalId: "idea-01-001-stakereview",
    slug: "stakereview",
    title: "StakeReview",
    tagline: "Universal product review layer",
    category: "Reviews & Ratings",
    categoryIndex: 1,
    ideaIndex: 1,
    description: "Desc",
    tags: ["dapp-idea"],
    status: "normalized",
    ...overrides,
  };
}

describe("dedupeIdeas", () => {
  it("removes duplicate titles", () => {
    const { ideas, removed } = dedupeIdeas([
      makeIdea(),
      makeIdea({ canonicalId: "idea-01-002-other", title: "StakeReview" }),
    ]);
    expect(ideas).toHaveLength(1);
    expect(removed).toHaveLength(1);
  });
});
