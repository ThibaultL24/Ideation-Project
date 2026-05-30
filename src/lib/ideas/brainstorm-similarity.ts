// src/lib/ideas/brainstorm-similarity.ts
import type { Idea } from "./schema";
import { loadNormalizedIdeas } from "./load";
import { findAtomsByLabelIlike, type AtomSearchRow } from "@/lib/intuition/graphql";
import { getNetworkConfig } from "@/lib/intuition/config";
import { buildIdeaFullState, type IdeaFullState } from "./idea-state";

export type SimilarityBadge =
  | "atom_exists"
  | "triple_exists"
  | "strong_signal"
  | "contested";

export type SimilarityGroup = "exact" | "close" | "adjacent";

export interface SimilarityItem {
  id: string;
  title: string;
  subtitle?: string;
  source: "catalog" | "graph";
  slug?: string;
  termId?: string;
  badges: SimilarityBadge[];
  group: SimilarityGroup;
  score: number;
}

export interface SimilarityResult {
  exact: SimilarityItem[];
  close: SimilarityItem[];
  adjacent: SimilarityItem[];
  challengeNotes: string[];
}

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "une",
  "des",
  "les",
  "sur",
  "pour",
  "app",
  "dapp",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().replace(/\s+/g, " ");
}

function scoreCatalogIdea(idea: Idea, tokens: string[], currentSlug?: string): number {
  if (idea.slug === currentSlug) return -1;
  const text = [idea.title, idea.tagline, idea.description, idea.category]
    .join(" ")
    .toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (text.includes(t)) score += 3;
  }
  if (tokens.some((t) => normalizeTitle(idea.title).includes(t))) score += 5;
  return score;
}

function catalogBadges(state: IdeaFullState): SimilarityBadge[] {
  const badges: SimilarityBadge[] = [];
  if (state.onchain?.atomInIndexer) badges.push("atom_exists");
  if (state.onchain?.coreTriplePresent) badges.push("triple_exists");
  if (state.onchain?.atomInIndexer && state.onchain.coreTriplePresent) {
    badges.push("strong_signal");
  }
  return badges;
}

function graphBadges(row: AtomSearchRow): SimilarityBadge[] {
  const badges: SimilarityBadge[] = ["atom_exists"];
  const positions = Number(row.vault?.positionCount ?? 0);
  const shares = Number(row.vault?.totalShares ?? 0);
  if (positions > 2 || shares > 0) badges.push("strong_signal");
  return badges;
}

function groupFromScore(score: number, exactTitle: boolean): SimilarityGroup {
  if (exactTitle || score >= 18) return "exact";
  if (score >= 8) return "close";
  return "adjacent";
}

function buildChallengeNotes(
  exact: SimilarityItem[],
  close: SimilarityItem[],
): string[] {
  const notes: string[] = [];
  if (exact.length > 0) {
    notes.push(
      `${exact.length} correspondance(s) exacte(s) — risque de redondance avec le graphe.`,
    );
  }
  const contested = [...exact, ...close].filter((i) =>
    i.badges.includes("strong_signal"),
  );
  if (contested.length > 0) {
    notes.push(
      "Des idées proches ont déjà du signal — votre angle doit être clairement distinct.",
    );
  }
  if (exact.length === 0 && close.length >= 5) {
    notes.push(
      "Secteur déjà peuplé — précisez l'objet attesté et le mécanisme de ranking.",
    );
  }
  if (notes.length === 0) {
    notes.push(
      "Peu de collision détectée — bonne fenêtre pour cristalliser le triple cœur.",
    );
  }
  return notes;
}

export async function searchSimilarIdeas(params: {
  query: string;
  currentSlug?: string;
  limitPerGroup?: number;
}): Promise<SimilarityResult> {
  const tokens = tokenize(params.query);
  const limit = params.limitPerGroup ?? 6;
  const all = loadNormalizedIdeas();
  const normalizedQuery = normalizeTitle(params.query);

  const ranked = all
    .map((idea) => ({
      idea,
      score: scoreCatalogIdea(idea, tokens, params.currentSlug),
      exactTitle: normalizeTitle(idea.title) === normalizedQuery,
    }))
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score);

  const catalogItems: SimilarityItem[] = [];
  for (const row of ranked.slice(0, 24)) {
    const state = await buildIdeaFullState(row.idea, { verifyOnchain: false });
    const group = groupFromScore(row.score, row.exactTitle);
    catalogItems.push({
      id: `cat:${row.idea.slug}`,
      title: row.idea.title,
      subtitle: row.idea.category,
      source: "catalog",
      slug: row.idea.slug,
      badges: catalogBadges(state),
      group,
      score: row.score,
    });
  }

  let graphItems: SimilarityItem[] = [];
  if (tokens.length > 0) {
    const config = getNetworkConfig();
    const searchTerm = tokens.slice(0, 3).join(" ");
    try {
      const atoms = await findAtomsByLabelIlike(config, searchTerm, 12);
      graphItems = atoms.map((row) => ({
        id: `graph:${row.term_id}`,
        title: row.label,
        subtitle: row.type,
        source: "graph" as const,
        termId: row.term_id,
        badges: graphBadges(row),
        group: "adjacent" as SimilarityGroup,
        score: 4,
      }));
    } catch {
      /* GraphQL optional */
    }
  }

  const merged = [...catalogItems, ...graphItems];
  const exact = merged.filter((i) => i.group === "exact").slice(0, limit);
  const close = merged
    .filter((i) => i.group === "close")
    .slice(0, limit);
  const adjacent = merged
    .filter((i) => i.group === "adjacent")
    .slice(0, limit);

  return {
    exact,
    close,
    adjacent,
    challengeNotes: buildChallengeNotes(exact, close),
  };
}
