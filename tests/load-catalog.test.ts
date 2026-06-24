// tests/load-catalog.test.ts
import { describe, expect, it } from "vitest";
import { mergeCatalogGraphWithJson } from "../src/lib/ideas/load-catalog";
import type { Idea } from "../src/lib/ideas/schema";

const jsonIdea: Idea = {
  canonicalId: "idea-01-001-stake-review",
  slug: "stake-review",
  title: "Stake Review",
  tagline: "Stake-weighted reviews",
  category: "Reviews & Ratings",
  categoryIndex: 1,
  ideaIndex: 1,
  description: "Description",
  tags: [],
  status: "normalized",
};

describe("mergeCatalogGraphWithJson", () => {
  it("enriches JSON ideas with on-chain atom ids from the graph slice", () => {
    const termId =
      "0x15cfa296a4c53232df083cc8610c9829f3b44860e5ba0d46d74f82cdd92b8fbb";
    const merged = mergeCatalogGraphWithJson({
      subjects: [
        {
          atomTermId: termId,
          tripleTermId: "0xtriple",
          label: "Stake Review",
          type: "Thing",
          ipfsUri: "ipfs://bafy",
        },
      ],
      jsonIdeas: [jsonIdea],
      canonicalByTerm: new Map([[termId.toLowerCase(), jsonIdea.canonicalId]]),
      termByCanonical: new Map([[jsonIdea.canonicalId, termId as `0x${string}`]]),
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]?.intuition?.atomId).toBe(termId);
    expect(merged[0]?.slug).toBe("stake-review");
  });

  it("creates a synthetic idea when graph row has no JSON match", () => {
    const merged = mergeCatalogGraphWithJson({
      subjects: [
        {
          atomTermId: "0xabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcab",
          tripleTermId: "0xtriple",
          label: "New Graph Idea",
          type: "Thing",
          ipfsUri: null,
        },
      ],
      jsonIdeas: [],
      canonicalByTerm: new Map(),
      termByCanonical: new Map(),
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]?.title).toBe("New Graph Idea");
    expect(merged[0]?.status).toBe("onchain");
  });
});
