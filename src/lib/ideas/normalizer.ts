// src/lib/ideas/normalizer.ts
import type { Idea } from "./schema";
import type { RawParsedIdea } from "./parser";
import { generateCanonicalId, slugifyTitle } from "./slug";

const MAX_TAGLINE = 160;

function firstSentence(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(.{20,200}?)(?:\.\s|$)/);
  if (match) return match[1].trim();
  return normalized.slice(0, MAX_TAGLINE);
}

function buildTags(category: string, comparable?: string): string[] {
  const tags = new Set<string>(["dapp-idea", "intuition", "ideation"]);
  const categorySlug = category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (categorySlug) tags.add(categorySlug);
  if (comparable) {
    for (const part of comparable.split(",")) {
      const token = part.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (token.length > 2) tags.add(token);
    }
  }
  return [...tags].slice(0, 12);
}

export function normalizeIdea(raw: RawParsedIdea): Idea {
  const slug = slugifyTitle(raw.title);
  const tagline = firstSentence(raw.description);
  return {
    canonicalId: generateCanonicalId(
      raw.categoryIndex,
      raw.ideaIndex,
      raw.title,
    ),
    slug,
    title: raw.title,
    tagline,
    category: raw.category,
    categoryIndex: raw.categoryIndex,
    ideaIndex: raw.ideaIndex,
    description: raw.description,
    comparable: raw.comparable,
    tags: buildTags(raw.category, raw.comparable),
    status: "normalized",
  };
}

export function normalizeIdeas(rawIdeas: RawParsedIdea[]): Idea[] {
  return rawIdeas.map(normalizeIdea);
}
