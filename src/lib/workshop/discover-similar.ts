// src/lib/workshop/discover-similar.ts
import type { Idea } from "@/lib/ideas/schema";

export interface CatalogMatch {
  canonicalId: string;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  score: number;
  matchReason: string;
}

const STOP = new Set([
  "avec", "pour", "dans", "une", "des", "les", "the", "and", "that", "this",
  "intuition", "idée", "idea", "app", "dapp", "qui", "sont", "est",
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9àâäéèêëïîôùûüç]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP.has(t));
}

function scoreIdea(idea: Idea, queryTokens: string[]): { score: number; reasons: string[] } {
  const hay = `${idea.title} ${idea.tagline} ${idea.description} ${idea.comparable ?? ""} ${idea.tags.join(" ")}`.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  for (const token of queryTokens) {
    if (idea.title.toLowerCase().includes(token)) {
      score += 4;
      reasons.push(`titre « ${token} »`);
    } else if (idea.tagline.toLowerCase().includes(token)) {
      score += 2;
      reasons.push(`tagline « ${token} »`);
    } else if (hay.includes(token)) {
      score += 1;
    }
  }

  if (idea.comparable) {
    for (const token of queryTokens) {
      if (idea.comparable.toLowerCase().includes(token)) {
        score += 2;
        reasons.push(`comparable « ${token} »`);
      }
    }
  }

  return { score, reasons: [...new Set(reasons)].slice(0, 3) };
}

export function rankCatalogIdeas(
  ideas: Idea[],
  rawIntent: string,
  ideaTitle: string,
  limit = 6,
): CatalogMatch[] {
  const queryTokens = [...new Set([...tokens(ideaTitle), ...tokens(rawIntent)])].slice(0, 12);
  if (queryTokens.length === 0) return [];

  const ranked = ideas
    .map((idea) => {
      const { score, reasons } = scoreIdea(idea, queryTokens);
      return {
        canonicalId: idea.canonicalId,
        slug: idea.slug,
        title: idea.title,
        tagline: idea.tagline,
        category: idea.category,
        score,
        matchReason:
          reasons.length > 0 ? reasons.join(", ") : "proximité lexicale faible",
      };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked;
}

export function overlapRiskLevel(
  catalogMatches: CatalogMatch[],
  similarAtomCount: number,
  coreTripleExists: boolean,
): "low" | "medium" | "high" {
  if (coreTripleExists || similarAtomCount >= 5) return "high";
  if (catalogMatches[0]?.score >= 8 || similarAtomCount >= 2) return "medium";
  return "low";
}
