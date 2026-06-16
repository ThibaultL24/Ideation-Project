// src/lib/ideas/category.ts
import { slugifyTitle } from "./slug";
import type { Idea } from "./schema";

export function categoryToSlug(category: string): string {
  return slugifyTitle(category);
}

export function categoryFromSlug(
  slug: string,
  categories: string[],
): string | null {
  return categories.find((c) => categoryToSlug(c) === slug) ?? null;
}

export function getCategoryCounts(ideas: Idea[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const idea of ideas) {
    counts.set(idea.category, (counts.get(idea.category) ?? 0) + 1);
  }
  return counts;
}
