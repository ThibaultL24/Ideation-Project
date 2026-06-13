// src/lib/ideas/resolve-idea-input.ts
// Resolves an idea for publish APIs: catalog lookup first, then a client-provided
// payload (free ideas live in the browser's localStorage, not on the server).
import { ideaSchema, type Idea } from "./schema";
import { loadNormalizedIdeas } from "./load";

export function resolveIdeaInput(slug?: string, ideaPayload?: unknown): Idea | null {
  if (!slug) return null;

  const catalog = loadNormalizedIdeas().find((item) => item.slug === slug);
  if (catalog) return catalog;

  if (!ideaPayload) return null;
  const parsed = ideaSchema.safeParse(ideaPayload);
  if (!parsed.success || parsed.data.slug !== slug) return null;
  return parsed.data;
}
