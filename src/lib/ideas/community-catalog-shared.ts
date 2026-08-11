// src/lib/ideas/community-catalog-shared.ts
import type { BrainstormDraft } from "./publish-plan";
import { ideaSchema, type Idea } from "./schema";

export const COMMUNITY_CATALOG_STORAGE_KEY = "community-catalog:v1";

/** Build / refresh a catalog row after a successful GitHub PR. */
export function buildPublishedCatalogIdea(params: {
  idea: Idea;
  draft?: Partial<BrainstormDraft> | null;
  prUrl: string;
  githubPath?: string;
}): Idea {
  const { idea, draft, prUrl, githubPath } = params;
  const problem = draft?.problem?.trim();
  const solution = draft?.solution?.trim();
  const description =
    [problem, solution].filter(Boolean).join("\n\n") || idea.description;

  return {
    ...idea,
    description,
    tagline: idea.tagline || solution?.slice(0, 160) || idea.tagline,
    category: idea.category || "Community Ideas",
    status: "github_published",
    tags: [...new Set([...(idea.tags ?? []), "community", "github-pr"])],
    github: {
      ...idea.github,
      path: githubPath ?? idea.github?.path,
      prUrl,
    },
  };
}

/** Merge community rows into a base catalog (community wins on slug conflict). */
export function mergeCommunityIntoCatalog(
  base: Idea[],
  community: Idea[],
): Idea[] {
  if (community.length === 0) return base;
  const bySlug = new Map(base.map((idea) => [idea.slug, idea]));
  for (const row of community) {
    const prev = bySlug.get(row.slug);
    bySlug.set(
      row.slug,
      prev
        ? {
            ...prev,
            ...row,
            github: { ...prev.github, ...row.github },
            intuition: { ...prev.intuition, ...row.intuition },
            tags: [...new Set([...(prev.tags ?? []), ...(row.tags ?? [])])],
          }
        : row,
    );
  }
  return [...bySlug.values()].sort((a, b) => a.title.localeCompare(b.title));
}

/** Browser helper — keep a local mirror so the publisher sees the idea immediately. */
export function upsertLocalCommunityIdea(idea: Idea): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(COMMUNITY_CATALOG_STORAGE_KEY);
    const current = raw ? (JSON.parse(raw) as Idea[]) : [];
    const list = Array.isArray(current) ? current : [];
    const next = [...list.filter((row) => row.slug !== idea.slug), idea];
    localStorage.setItem(COMMUNITY_CATALOG_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadLocalCommunityIdeas(): Idea[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMMUNITY_CATALOG_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as Idea[];
    if (!Array.isArray(list)) return [];
    return list
      .map((item) => {
        const parsed = ideaSchema.safeParse(item);
        return parsed.success ? parsed.data : null;
      })
      .filter((idea): idea is Idea => idea !== null);
  } catch {
    return [];
  }
}
