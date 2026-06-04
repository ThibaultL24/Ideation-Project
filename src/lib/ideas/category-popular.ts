// src/lib/ideas/category-popular.ts
import type { Idea } from "./schema";
import { getReportedAtomId } from "./idea-state";
import { getNetworkConfig } from "@/lib/intuition/config";
import {
  fetchAtomVaultShares,
  findAtomTermIdsInGraphql,
} from "@/lib/intuition/graphql";

export interface PopularIdeaInCategory {
  idea: Idea;
  termId: string;
  totalShares: number;
  atomInIndexer: boolean;
}

export async function getPopularIdeasInCategory(
  ideas: Idea[],
  category: string,
  limit = 12,
): Promise<PopularIdeaInCategory[]> {
  const inCategory = ideas.filter((i) => i.category === category);
  const withTermId: Array<{ idea: Idea; termId: string }> = [];

  for (const idea of inCategory) {
    const termId = getReportedAtomId(idea);
    if (termId) withTermId.push({ idea, termId });
  }

  if (withTermId.length === 0) return [];

  const config = getNetworkConfig();
  const termIds = withTermId.map((r) => r.termId);
  let sharesByTerm = new Map<string, number>();

  try {
    sharesByTerm = await fetchAtomVaultShares(config, termIds);
  } catch {
    sharesByTerm = new Map(termIds.map((id) => [id, 0]));
  }

  let indexed = new Set<string>();
  try {
    indexed = await findAtomTermIdsInGraphql(
      config,
      withTermId.map((r) => r.termId),
    );
  } catch {
    indexed = new Set(withTermId.map((r) => r.termId));
  }

  const rows: PopularIdeaInCategory[] = [];

  for (const { idea, termId } of withTermId) {
    if (!indexed.has(termId)) continue;
    rows.push({
      idea,
      termId,
      totalShares: sharesByTerm.get(termId) ?? 0,
      atomInIndexer: true,
    });
  }

  rows.sort((a, b) => b.totalShares - a.totalShares);

  if (rows.every((r) => r.totalShares === 0)) {
    return rows.slice(0, limit);
  }

  return rows.slice(0, limit);
}
