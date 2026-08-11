// src/lib/ideas/community-catalog.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { BrainstormDraft } from "./publish-plan";
import { ideaSchema, type Idea } from "./schema";

const COMMUNITY_DIR = path.join(process.cwd(), "data/community");
const COMMUNITY_PATH = path.join(COMMUNITY_DIR, "published-ideas.json");

export const COMMUNITY_CATALOG_STORAGE_KEY = "community-catalog:v1";

interface CommunityCatalogFile {
  ideas: Idea[];
  updatedAt?: string;
}

function readCommunityFile(): Idea[] {
  if (!existsSync(COMMUNITY_PATH)) return [];
  try {
    const payload = JSON.parse(
      readFileSync(COMMUNITY_PATH, "utf8"),
    ) as CommunityCatalogFile;
    return (payload.ideas ?? [])
      .map((item) => {
        const parsed = ideaSchema.safeParse(item);
        return parsed.success ? parsed.data : null;
      })
      .filter((idea): idea is Idea => idea !== null);
  } catch {
    return [];
  }
}

function writeCommunityFile(ideas: Idea[]): void {
  mkdirSync(COMMUNITY_DIR, { recursive: true });
  const payload: CommunityCatalogFile = {
    ideas,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(COMMUNITY_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function loadCommunityIdeas(): Idea[] {
  return readCommunityFile();
}

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

export function upsertCommunityIdea(idea: Idea): Idea {
  const existing = readCommunityFile();
  const next = [...existing.filter((row) => row.slug !== idea.slug), idea].sort(
    (a, b) => a.title.localeCompare(b.title),
  );
  writeCommunityFile(next);
  return idea;
}

/** Merge community rows into a base catalog (community wins on slug conflict). */
export function mergeCommunityIntoCatalog(
  base: Idea[],
  community: Idea[] = loadCommunityIdeas(),
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
