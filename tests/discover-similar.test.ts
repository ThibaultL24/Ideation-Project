// tests/discover-similar.test.ts
import { describe, expect, it } from "vitest";
import { overlapRiskLevel, rankCatalogIdeas } from "@/lib/workshop/discover-similar";
import type { Idea } from "@/lib/ideas/schema";

const sample: Idea[] = [
  {
    canonicalId: "idea-01-test",
    slug: "vet-vault",
    title: "Vet Vault",
    tagline: "Staked vet reviews",
    category: "Pets",
    categoryIndex: 1,
    ideaIndex: 1,
    description: "Reputation for veterinarians with staked reviews on chain",
    tags: ["vet", "reputation"],
    status: "normalized",
  },
  {
    canonicalId: "idea-02-other",
    slug: "solar-score",
    title: "Solar Score",
    tagline: "Solar installers ranked",
    category: "Energy",
    categoryIndex: 2,
    ideaIndex: 1,
    description: "Green energy ranking",
    tags: ["solar"],
    status: "normalized",
  },
];

describe("rankCatalogIdeas", () => {
  it("ranks vet-related intent higher for vet catalog idea", () => {
    const matches = rankCatalogIdeas(
      sample,
      "Une app de réputation pour vétérinaires avec avis stakés",
      "Vet Reviews",
    );
    expect(matches[0]?.slug).toBe("vet-vault");
    expect(matches[0]?.score).toBeGreaterThan(0);
  });
});

describe("overlapRiskLevel", () => {
  it("returns high when core triple exists", () => {
    expect(overlapRiskLevel([], 0, true)).toBe("high");
  });
});
