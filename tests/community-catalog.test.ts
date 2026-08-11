// tests/community-catalog.test.ts
import { describe, expect, it } from "vitest";
import {
  buildPublishedCatalogIdea,
  mergeCommunityIntoCatalog,
} from "@/lib/ideas/community-catalog";
import type { Idea } from "@/lib/ideas/schema";

const baseIdea: Idea = {
  canonicalId: "free-map-demo",
  slug: "free-map-demo",
  title: "History Map",
  tagline: "Trace a life on a map",
  category: "Community Ideas",
  categoryIndex: 999,
  ideaIndex: 999,
  description: "Seed description",
  tags: ["free-idea"],
  status: "draft",
};

describe("community catalog", () => {
  it("marks an idea github_published with PR metadata", () => {
    const published = buildPublishedCatalogIdea({
      idea: baseIdea,
      draft: {
        problem: "Sources are scattered across archives.",
        solution: "An interactive map of verified events.",
      },
      prUrl: "https://github.com/intuition-box/ideas/pull/1",
      githubPath: "ideas/2026-08-11-free-map-demo/README.md",
    });

    expect(published.status).toBe("github_published");
    expect(published.github?.prUrl).toContain("/pull/1");
    expect(published.description).toContain("Sources are scattered");
    expect(published.tags).toContain("github-pr");
  });

  it("merges community ideas into the catalog by slug", () => {
    const published = buildPublishedCatalogIdea({
      idea: baseIdea,
      prUrl: "https://github.com/intuition-box/ideas/pull/2",
    });
    const merged = mergeCommunityIntoCatalog(
      [
        {
          ...baseIdea,
          slug: "stake-review",
          canonicalId: "idea-01-001",
          title: "StakeReview",
          category: "Reviews & Ratings",
          status: "normalized",
        },
      ],
      [published],
    );

    expect(merged).toHaveLength(2);
    expect(merged.find((row) => row.slug === "free-map-demo")?.github?.prUrl).toBe(
      "https://github.com/intuition-box/ideas/pull/2",
    );
  });
});
