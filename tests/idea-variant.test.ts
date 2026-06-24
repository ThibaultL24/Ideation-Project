// tests/idea-variant.test.ts
import { describe, expect, it } from "vitest";
import { buildBrainstormVariantFingerprint } from "../src/lib/ideas/idea-variant";
import type { Idea } from "../src/lib/ideas/schema";

const baseIdea: Idea = {
  canonicalId: "idea-01-001-test",
  slug: "test-idea",
  title: "Test Idea",
  tagline: "A test",
  category: "Reviews & Ratings",
  categoryIndex: 1,
  ideaIndex: 1,
  description: "Description",
  tags: [],
  status: "normalized",
};

describe("buildBrainstormVariantFingerprint", () => {
  it("changes when the GitHub PR URL changes", () => {
    const a = buildBrainstormVariantFingerprint(
      baseIdea,
      { problem: "Same problem" },
      "https://github.com/org/ideas/pull/1",
    );
    const b = buildBrainstormVariantFingerprint(
      baseIdea,
      { problem: "Same problem" },
      "https://github.com/org/ideas/pull/2",
    );
    expect(a).not.toBe(b);
  });

  it("changes when draft content changes", () => {
    const a = buildBrainstormVariantFingerprint(baseIdea, { problem: "A" });
    const b = buildBrainstormVariantFingerprint(baseIdea, { problem: "B" });
    expect(a).not.toBe(b);
  });

  it("is stable for the same draft and PR URL", () => {
    const draft = { problem: "Stable", solution: "Stable solution" };
    const url = "https://github.com/org/ideas/pull/42";
    expect(
      buildBrainstormVariantFingerprint(baseIdea, draft, url),
    ).toBe(buildBrainstormVariantFingerprint(baseIdea, draft, url));
  });
});
