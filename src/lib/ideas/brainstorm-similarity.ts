// src/lib/ideas/brainstorm-similarity.ts
import type { Idea } from "./schema";
import { getNetworkConfig } from "@/lib/intuition/config";
import {
  findAtomsByLabelIlike,
  type AtomRow,
} from "@/lib/intuition/graphql";
import { buildIdeaFullState, type IdeaFullState } from "./idea-state";
import { loadNormalizedIdeas } from "./load";
import { slugifyTitle } from "./slug";

const STOP_WORDS = new Set([
  "je",
  "veux",
  "créer",
  "creer",
  "une",
  "un",
  "des",
  "du",
  "de",
  "la",
  "le",
  "les",
  "sur",
  "pour",
  "avec",
  "dans",
  "qui",
  "que",
  "est",
  "sont",
  "app",
  "application",
  "dapp",
  "the",
  "a",
  "an",
  "to",
  "for",
  "on",
  "and",
  "or",
  "i",
  "want",
  "build",
  "make",
  "mon",
  "ma",
  "mes",
  // English filler common in long free-form intents
  "that",
  "this",
  "these",
  "those",
  "can",
  "could",
  "would",
  "should",
  "their",
  "there",
  "them",
  "they",
  "then",
  "than",
  "each",
  "from",
  "with",
  "into",
  "about",
  "which",
  "will",
  "have",
  "been",
  "were",
  "was",
  "are",
  "who",
  "how",
  "what",
  "when",
  "where",
  "your",
  "our",
  "also",
  "just",
  "more",
  "most",
  "some",
  "any",
  "all",
  "users",
  "user",
  "people",
  "piece",
  "information",
]);

/** Minimum lexical score to count as nearby (~1 meaningful token hit after stop-word filtering). */
export const NEARBY_MATCH_SCORE = 3;

export const STRONG_MATCH_SCORE = 9;

export function tokenizePrompt(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function ideaSearchText(idea: Idea): string {
  return [
    idea.title,
    idea.tagline,
    idea.description,
    idea.category,
    idea.comparable ?? "",
    ...idea.tags,
  ]
    .join(" ")
    .toLowerCase();
}

export function scoreIdeaForPrompt(
  idea: Idea,
  tokens: string[],
  category?: string,
): number {
  const title = idea.title.toLowerCase();
  const tagline = idea.tagline.toLowerCase();
  const text = ideaSearchText(idea);
  let score = 0;

  for (const token of tokens) {
    if (title.includes(token)) score += 5;
    else if (tagline.includes(token)) score += 3;
    else if (text.includes(token)) score += 1;
  }

  if (category && idea.category === category) score += 6;

  const promptJoined = tokens.join(" ");
  if (promptJoined.length > 4 && text.includes(promptJoined.slice(0, 24))) {
    score += 8;
  }

  const titleNorm = idea.title.toLowerCase().replace(/[^a-z0-9]/g, "");
  const promptNorm = tokens.join("");
  if (titleNorm.length > 3 && promptNorm.includes(titleNorm)) score += 12;
  if (promptNorm.length > 3 && titleNorm.includes(promptNorm.slice(0, 12))) {
    score += 10;
  }

  return score;
}

/** Rank catalog ideas by lexical overlap; only keep scores ≥ minScore. */
export function rankCatalogByPrompt(params: {
  prompt: string;
  category?: string;
  minScore?: number;
  limit?: number;
}): Array<{ idea: Idea; score: number }> {
  const tokens = tokenizePrompt(params.prompt.trim());
  if (tokens.length === 0) return [];

  const minScore = params.minScore ?? NEARBY_MATCH_SCORE;
  const ranked = loadNormalizedIdeas()
    .map((idea) => ({
      idea,
      score: scoreIdeaForPrompt(idea, tokens, params.category),
    }))
    .filter((row) => row.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return params.limit != null ? ranked.slice(0, params.limit) : ranked;
}

export interface CatalogSimilarMatch {
  idea: Idea;
  score: number;
  state: IdeaFullState;
}

export interface SimilarSearchResult {
  prompt: string;
  category: string | null;
  catalogMatches: CatalogSimilarMatch[];
  graphMatches: AtomRow[];
  hasStrongMatch: boolean;
}

export async function findSimilarIdeas(params: {
  prompt: string;
  category?: string;
  limit?: number;
}): Promise<SimilarSearchResult> {
  const prompt = params.prompt.trim();
  const tokens = tokenizePrompt(prompt);
  const limit = params.limit ?? 5;

  const ranked = rankCatalogByPrompt({
    prompt,
    category: params.category,
    minScore: NEARBY_MATCH_SCORE,
    limit,
  });

  const catalogMatches: CatalogSimilarMatch[] = await Promise.all(
    ranked.map(async (row) => ({
      idea: row.idea,
      score: row.score,
      state: await buildIdeaFullState(row.idea, { verifyOnchain: false }),
    })),
  );

  const config = getNetworkConfig();
  const graphMatches: AtomRow[] = [];
  const seenTermIds = new Set<string>();

  const ilikePattern =
    tokens.length > 0 ? `%${tokens.slice(0, 3).join("%")}%` : `%${prompt.slice(0, 40)}%`;

  try {
    const rows = await findAtomsByLabelIlike(config, ilikePattern, 15);
    for (const row of rows) {
      if (seenTermIds.has(row.term_id)) continue;
      seenTermIds.add(row.term_id);
      graphMatches.push(row);
    }
  } catch {
    /* GraphQL optional */
  }

  if (tokens[0]) {
    try {
      const byFirst = await findAtomsByLabelIlike(
        config,
        `%${tokens[0]}%`,
        10,
      );
      for (const row of byFirst) {
        if (seenTermIds.has(row.term_id)) continue;
        seenTermIds.add(row.term_id);
        graphMatches.push(row);
      }
    } catch {
      /* ignore */
    }
  }

  const hasStrongMatch =
    catalogMatches.some((m) => m.score >= STRONG_MATCH_SCORE) ||
    (graphMatches.length > 0 &&
      catalogMatches.some((m) => m.score >= 6));

  return {
    prompt,
    category: params.category ?? null,
    catalogMatches,
    graphMatches: graphMatches.slice(0, limit),
    hasStrongMatch,
  };
}

export function draftIdeaFromPrompt(prompt: string, category: string): Idea {
  const title =
    prompt.length > 80 ? `${prompt.slice(0, 77)}…` : prompt || "New idea";
  const slug = slugifyTitle(prompt.slice(0, 60)) || "new-idea";
  const draftSlug = `draft-${slug}`;

  return {
    canonicalId: draftSlug,
    slug: draftSlug,
    title,
    tagline: prompt,
    category,
    categoryIndex: 1,
    ideaIndex: 1,
    description: prompt,
    tags: ["draft", "brainstorm", "dapp-idea"],
    status: "draft",
  };
}
