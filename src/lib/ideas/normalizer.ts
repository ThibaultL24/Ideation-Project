// src/lib/ideas/normalizer.ts
import type { RawParsedIdea } from "./parser";
import type { Idea } from "./schema";
import { generateCanonicalId, slugifyTitle } from "./slug";

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^[^.!?]+[.!?]/);
  if (match) return match[0].trim();
  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed;
}

function categoryTag(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function comparableTags(comparable?: string): string[] {
  if (!comparable) return [];
  return comparable
    .split(/[,;/]/)
    .map((part) =>
      part
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .filter((tag) => tag.length > 1);
}

export function normalizeIdea(raw: RawParsedIdea): Idea {
  const slug = slugifyTitle(raw.title);
  const tags = new Set<string>(["dapp-idea", "intuition", "ideation"]);
  tags.add(categoryTag(raw.category));
  for (const tag of comparableTags(raw.comparable)) {
    tags.add(tag);
  }

  return {
    canonicalId: generateCanonicalId(raw.categoryIndex, raw.ideaIndex, raw.title),
    slug,
    title: raw.title,
    tagline: firstSentence(raw.description),
    category: raw.category,
    categoryIndex: raw.categoryIndex,
    ideaIndex: raw.ideaIndex,
    description: raw.description,
    comparable: raw.comparable,
    tags: [...tags],
    status: "normalized",
  };
}

export function normalizeIdeas(rawIdeas: RawParsedIdea[]): Idea[] {
  return rawIdeas.map(normalizeIdea);
}
