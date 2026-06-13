// src/lib/ideas/free-idea.ts
import type { Idea } from "./schema";
import { slugifyTitle } from "./slug";

export function createFreeIdea(params: {
  intent: string;
  title: string;
  description: string;
}): Idea {
  const base = slugifyTitle(params.title || params.intent.slice(0, 48)) || "idea";
  const slug = `free-${base}-${Date.now().toString(36).slice(-4)}`;

  return {
    canonicalId: slug,
    slug,
    title: params.title.trim() || "Nouvelle idée",
    tagline: params.intent.trim().slice(0, 160),
    category: "Community Ideas",
    categoryIndex: 999,
    ideaIndex: 999,
    description: params.description.trim() || params.intent.trim(),
    tags: ["free-idea", "ideation"],
    status: "draft",
  };
}

export function isFreeIdeaSlug(slug: string): boolean {
  return slug.startsWith("free-");
}
