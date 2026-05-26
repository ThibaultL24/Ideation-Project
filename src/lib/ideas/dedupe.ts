// src/lib/ideas/dedupe.ts
import type { Idea } from "./schema";

export interface DedupeResult {
  ideas: Idea[];
  removed: Array<{ title: string; canonicalId: string; reason: string }>;
}

export function dedupeIdeas(ideas: Idea[]): DedupeResult {
  const byCanonical = new Map<string, Idea>();
  const byTitle = new Map<string, Idea>();
  const removed: DedupeResult["removed"] = [];

  for (const idea of ideas) {
    const titleKey = idea.title.toLowerCase();
    const existingByTitle = byTitle.get(titleKey);
    if (existingByTitle) {
      removed.push({
        title: idea.title,
        canonicalId: idea.canonicalId,
        reason: `duplicate title (kept ${existingByTitle.canonicalId})`,
      });
      continue;
    }

    const existingByCanonical = byCanonical.get(idea.canonicalId);
    if (existingByCanonical) {
      removed.push({
        title: idea.title,
        canonicalId: idea.canonicalId,
        reason: `duplicate canonicalId (kept ${existingByCanonical.canonicalId})`,
      });
      continue;
    }

    byCanonical.set(idea.canonicalId, idea);
    byTitle.set(titleKey, idea);
  }

  return {
    ideas: [...byCanonical.values()].sort((a, b) => {
      if (a.categoryIndex !== b.categoryIndex) {
        return a.categoryIndex - b.categoryIndex;
      }
      return a.ideaIndex - b.ideaIndex;
    }),
    removed,
  };
}
