// src/lib/ideas/load-catalog.ts
import { unstable_cache } from "next/cache";
import type { Hex } from "viem";
import { getNetworkConfig, type IntuitionNetwork } from "@/lib/intuition/config";
import { fetchCatalogGraphSlice, type CatalogGraphSubject } from "@/lib/intuition/catalog-graph";
import {
  loadCommunityIdeas,
  mergeCommunityIntoCatalog,
} from "./community-catalog";
import { getCategories, loadNormalizedIdeas } from "./load";
import {
  invertAtomMap,
  loadMigrationAtomMap,
} from "./migration-reports";
import { slugifyTitle } from "./slug";
import type { Idea } from "./schema";

export type CatalogSource = "graph" | "json-fallback";

export interface CatalogLoadResult {
  ideas: Idea[];
  source: CatalogSource;
  network: IntuitionNetwork;
  onchainCount: number;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function enrichIdeaWithOnchain(
  idea: Idea,
  atomTermId: string,
  tripleTermId?: string,
): Idea {
  const triples = new Set(idea.intuition?.triples ?? []);
  if (tripleTermId) triples.add(tripleTermId);

  return {
    ...idea,
    status: idea.status === "draft" ? "onchain" : idea.status,
    intuition: {
      ...idea.intuition,
      atomId: atomTermId,
      triples: triples.size > 0 ? [...triples] : idea.intuition?.triples,
    },
  };
}

function syntheticIdeaFromGraph(params: {
  label: string;
  atomTermId: string;
  tripleTermId: string;
  canonicalId?: string;
}): Idea {
  const slug = slugifyTitle(params.label) || "idea";
  return {
    canonicalId: params.canonicalId ?? `graph-${params.atomTermId.slice(2, 18)}`,
    slug,
    title: params.label,
    tagline: "",
    category: "On-chain catalog",
    categoryIndex: 1,
    ideaIndex: 1,
    description: "Listed on the Intuition ideation graph (metadata pending local sync).",
    tags: [],
    status: "onchain",
    intuition: {
      atomId: params.atomTermId,
      triples: [params.tripleTermId],
    },
  };
}

export function mergeCatalogGraphWithJson(params: {
  subjects: CatalogGraphSubject[];
  jsonIdeas: Idea[];
  canonicalByTerm: Map<string, string>;
  termByCanonical: Map<string, Hex>;
}): Idea[] {
  const { subjects, jsonIdeas, canonicalByTerm, termByCanonical } = params;

  const byCanonical = new Map(jsonIdeas.map((idea) => [idea.canonicalId, idea]));
  const byTitle = new Map(
    jsonIdeas.map((idea) => [normalizeTitle(idea.title), idea]),
  );
  const byTermId = new Map<string, Idea>();
  for (const idea of jsonIdeas) {
    const termId = termByCanonical.get(idea.canonicalId);
    if (termId) byTermId.set(termId.toLowerCase(), idea);
  }

  const merged: Idea[] = [];
  const seen = new Set<string>();

  for (const row of subjects) {
    const termKey = row.atomTermId.toLowerCase();
    const canonicalId = canonicalByTerm.get(termKey);
    const base =
      byTermId.get(termKey) ??
      (canonicalId ? byCanonical.get(canonicalId) : undefined) ??
      byTitle.get(normalizeTitle(row.label));

    const idea = base
      ? enrichIdeaWithOnchain(base, row.atomTermId, row.tripleTermId)
      : syntheticIdeaFromGraph({
          label: row.label,
          atomTermId: row.atomTermId,
          tripleTermId: row.tripleTermId,
          canonicalId,
        });

    const key = idea.canonicalId;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(idea);
  }

  return merged.sort((a, b) => a.title.localeCompare(b.title));
}

async function loadCatalogIdeasUncached(): Promise<CatalogLoadResult> {
  const network = getNetworkConfig().network;
  const jsonIdeas = loadNormalizedIdeas();
  const communityIdeas = loadCommunityIdeas();
  const slice = await fetchCatalogGraphSlice(network);

  if (!slice || slice.subjects.length === 0) {
    return {
      ideas: mergeCommunityIntoCatalog(jsonIdeas, communityIdeas),
      source: "json-fallback",
      network,
      onchainCount: 0,
    };
  }

  const termByCanonical = loadMigrationAtomMap(network);
  const canonicalByTerm = invertAtomMap(termByCanonical);

  const graphIdeas = mergeCatalogGraphWithJson({
    subjects: slice.subjects,
    jsonIdeas,
    canonicalByTerm,
    termByCanonical,
  });

  // Keep graph-backed rows, then layer PR-published community ideas (incl. new free ideas).
  const ideas = mergeCommunityIntoCatalog(graphIdeas, communityIdeas);

  return {
    ideas,
    source: "graph",
    network,
    onchainCount: graphIdeas.length,
  };
}

export async function loadCatalogIdeas(): Promise<CatalogLoadResult> {
  const network = getNetworkConfig().network;
  const cached = unstable_cache(
    loadCatalogIdeasUncached,
    ["catalog-ideas", network],
    { revalidate: 120, tags: ["catalog-ideas"] },
  );
  return cached();
}

export async function loadCatalogIdeaBySlug(
  slug: string,
): Promise<Idea | undefined> {
  const { ideas } = await loadCatalogIdeas();
  return ideas.find((idea) => idea.slug === slug);
}

export async function getCatalogCategories(): Promise<string[]> {
  const { ideas } = await loadCatalogIdeas();
  return getCategories(ideas);
}
