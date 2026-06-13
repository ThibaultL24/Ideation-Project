// src/lib/ideas/similar-catalog.ts
import { buildIdeaFullState } from "./idea-state";
import {
  buildFiltersFromAnswers,
  rankIdeas,
  type PickRefineResponse,
} from "./pick-refinement";
import { loadNormalizedIdeas } from "./load";

export async function searchSimilarCatalog(
  intent: string,
  limit = 6,
): Promise<PickRefineResponse> {
  const trimmed = intent.trim();
  const filters = buildFiltersFromAnswers(trimmed, [], [], undefined);
  const ranked = rankIdeas(loadNormalizedIdeas(), filters, trimmed);
  const top = ranked.slice(0, limit);
  const cards = await Promise.all(
    top.map((idea) => buildIdeaFullState(idea, { verifyOnchain: false })),
  );

  return {
    step: 1,
    matchCount: ranked.length,
    filters,
    filtersSummary: [],
    question: null,
    cards,
    readyToSelect: false,
  };
}
