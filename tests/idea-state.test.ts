// tests/idea-state.test.ts
import { describe, expect, it } from "vitest";
import {
  getIdeaDbState,
  resolveNextAction,
  buildBadges,
  pickRandomIdeas,
} from "../src/lib/ideas/idea-state";
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

describe("getIdeaDbState", () => {
  it("marks normalized idea as not scoped", () => {
    const db = getIdeaDbState(baseIdea);
    expect(db.scoped).toBe(false);
    expect(db.hasGithubPr).toBe(false);
  });

  it("marks github PR as scoped", () => {
    const db = getIdeaDbState({
      ...baseIdea,
      status: "normalized",
      github: { prUrl: "https://github.com/intuition-box/ideas/pull/1" },
    });
    expect(db.scoped).toBe(true);
    expect(db.hasGithubPr).toBe(true);
  });
});

describe("resolveNextAction", () => {
  it("suggests create_with_prompt when no PR and not scoped", () => {
    const db = getIdeaDbState(baseIdea);
    expect(resolveNextAction(db, null)).toBe("create_with_prompt");
  });

  it("suggests view_ready when PR and onchain complete", () => {
    const db = getIdeaDbState({
      ...baseIdea,
      github: { prUrl: "https://github.com/intuition-box/ideas/pull/1" },
    });
    expect(
      resolveNextAction(db, {
        atomId: "0xabc",
        atomInIndexer: true,
        coreTriplePresent: true,
        network: "testnet",
      }),
    ).toBe("view_ready");
  });
});

describe("pickRandomIdeas", () => {
  it("returns requested count without duplicates", () => {
    const items = [1, 2, 3, 4, 5, 6];
    const picked = pickRandomIdeas(items, 4);
    expect(picked).toHaveLength(4);
    expect(new Set(picked).size).toBe(4);
  });
});

describe("buildBadges", () => {
  it("includes needs_work for raw ideas", () => {
    const db = getIdeaDbState(baseIdea);
    expect(buildBadges(db, null)).toContain("needs_work");
  });
});
