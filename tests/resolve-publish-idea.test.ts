import { describe, expect, it } from "vitest";
import { draftIdeaFromPrompt } from "../src/lib/ideas/brainstorm-similarity";
import { loadNormalizedIdeas } from "../src/lib/ideas/load";
import { resolvePublishIdea } from "../src/lib/ideas/resolve-publish-idea";

describe("resolvePublishIdea", () => {
  it("resolves catalog slug", () => {
    const idea = loadNormalizedIdeas()[0];
    expect(resolvePublishIdea({ slug: idea.slug })?.slug).toBe(idea.slug);
  });

  it("resolves draft slug with prompt and category", () => {
    const draft = draftIdeaFromPrompt("Wallet social", "DeFi");
    const resolved = resolvePublishIdea({
      slug: draft.slug,
      prompt: "Wallet social",
      category: "DeFi",
    });
    expect(resolved?.slug).toBe(draft.slug);
    expect(resolved?.title).toBeTruthy();
  });

  it("resolves draft when idea object is sent", () => {
    const draft = draftIdeaFromPrompt("NFT gallery", "NFT");
    expect(
      resolvePublishIdea({
        slug: draft.slug,
        idea: draft,
        prompt: draft.tagline,
        category: draft.category,
      })?.slug,
    ).toBe(draft.slug);
  });
});
