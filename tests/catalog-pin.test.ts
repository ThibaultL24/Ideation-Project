// tests/catalog-pin.test.ts
import { describe, expect, it } from "vitest";
import {
  catalogIdeaToPinThing,
  ideaToPinThing,
} from "../src/lib/intuition/idea-thing";
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

describe("catalogIdeaToPinThing (bounty 3A)", () => {
  it("omits brainstorm variant fingerprint", () => {
    const catalog = catalogIdeaToPinThing(baseIdea);
    expect(catalog.description).not.toContain("Brainstorm variant fingerprint");
    expect(catalog.description).not.toContain("Slug:");
  });

  it("differs from dapp variant pin for the same idea", () => {
    const catalog = catalogIdeaToPinThing(baseIdea);
    const variant = ideaToPinThing(baseIdea, undefined, { problem: "P" });
    expect(variant.description).toContain("Brainstorm variant fingerprint");
    expect(variant.description).not.toBe(catalog.description);
  });
});
