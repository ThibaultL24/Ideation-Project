// src/lib/ideas/similar-catalog.ts
import {
  NEARBY_MATCH_SCORE,
  rankCatalogByPrompt,
} from "@/lib/ideas/brainstorm-similarity";
import { buildIdeaFullState } from "./idea-state";
import {
  buildFiltersFromAnswers,
  type PickRefineResponse,
} from "./pick-refinement";

/**
 * Nearby catalog ideas for guided ideation.
 * matchCount = ideas above NEARBY_MATCH_SCORE (not the full catalog size).
 */
export async function searchSimilarCatalog(
  intent: string,
  limit = 6,
): Promise<PickRefineResponse> {
  const trimmed = intent.trim();
  const filters = buildFiltersFromAnswers(trimmed, [], [], undefined);

  const nearby = rankCatalogByPrompt({
    prompt: trimmed,
    minScore: NEARBY_MATCH_SCORE,
  });
  const top = nearby.slice(0, limit);
  const cards = await Promise.all(
    top.map((row) => buildIdeaFullState(row.idea, { verifyOnchain: false })),
  );

  return {
    step: 1,
    matchCount: nearby.length,
    filters,
    filtersSummary: [],
    question: null,
    cards,
    readyToSelect: false,
  };
}
