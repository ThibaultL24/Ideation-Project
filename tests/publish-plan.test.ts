import { describe, expect, it } from "vitest";
import { buildPublishPlan } from "../src/lib/ideas/publish-plan";
import type { Idea } from "../src/lib/ideas/schema";

const idea: Idea = {
  canonicalId: "idea-01-001-stake-review",
  slug: "stake-review",
  title: "StakeReview",
  tagline: "Stake-backed reviews for products",
  category: "Reviews & Ratings",
  categoryIndex: 1,
  ideaIndex: 1,
  description: "A review layer where consumers stake on quality claims.",
  tags: ["reviews-ratings", "intuition"],
  status: "normalized",
};

describe("buildPublishPlan", () => {
  it("creates the GitHub markdown and core triple for a refined idea", () => {
    const plan = buildPublishPlan(idea, {
      archetype: "reputation",
      problem: "Consumers cannot tell which product reviews are durable and backed by real conviction.",
      solution: "Users create quality claims, stake on them, and browse ranked product trust signals.",
      users: "Power shoppers, review communities, and Intuition builders.",
      intuitionFit: "Products and claims become atoms. Review claims become triples with signal.",
      mvp: "Random product, claim composer, trust-ranked review page.",
      risks: "Cold start and review spam.",
      challenge: "The MVP must prove that stake changes review quality.",
      supportTriples: "StakeReview -> targets -> shoppers",
    });

    expect(plan.githubPath).toMatch(/ideas\/\d{4}-\d{2}-\d{2}-stake-review\/README\.md/);
    expect(plan.coreTriple).toEqual([
      "StakeReview",
      "top project ideas for",
      "Intuition",
    ]);
    expect(plan.markdown).toContain("# StakeReview");
    expect(plan.supportTriples).toEqual([
      ["StakeReview", "targets", "shoppers"],
    ]);
    expect(plan.readiness.githubReady).toBe(true);
  });
});
