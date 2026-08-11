// src/lib/ideas/community-catalog.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ideaSchema, type Idea } from "./schema";

export {
  COMMUNITY_CATALOG_STORAGE_KEY,
  buildPublishedCatalogIdea,
  mergeCommunityIntoCatalog,
  upsertLocalCommunityIdea,
  loadLocalCommunityIdeas,
} from "./community-catalog-shared";

const COMMUNITY_DIR = path.join(process.cwd(), "data/community");
const COMMUNITY_PATH = path.join(COMMUNITY_DIR, "published-ideas.json");

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

export function upsertCommunityIdea(idea: Idea): Idea {
  const existing = readCommunityFile();
  const next = [...existing.filter((row) => row.slug !== idea.slug), idea].sort(
    (a, b) => a.title.localeCompare(b.title),
  );
  writeCommunityFile(next);
  return idea;
}
