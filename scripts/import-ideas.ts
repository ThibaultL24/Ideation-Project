// scripts/import-ideas.ts
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import {
  parseIdeasFromText,
  normalizeIdeas,
  dedupeIdeas,
  ideaSchema,
  type Idea,
} from "../src/lib/ideas";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_PATH = path.join(ROOT, "data/raw/ideas.txt");
const OUT_PATH = path.join(ROOT, "data/normalized/ideas.json");

function loadExisting(): Map<string, Idea> {
  if (!existsSync(OUT_PATH)) return new Map();
  const payload = JSON.parse(readFileSync(OUT_PATH, "utf8")) as {
    ideas: Idea[];
  };
  return new Map(payload.ideas.map((idea) => [idea.canonicalId, idea]));
}

function mergeEnrichment(fresh: Idea, existing?: Idea): Idea {
  if (!existing) return fresh;
  return {
    ...fresh,
    status: existing.status ?? fresh.status,
    github: existing.github ?? fresh.github,
    ipfs: existing.ipfs ?? fresh.ipfs,
    intuition: existing.intuition ?? fresh.intuition,
  };
}

function main() {
  const raw = readFileSync(RAW_PATH, "utf8");
  const parsed = parseIdeasFromText(raw);
  const normalized = normalizeIdeas(parsed);
  const { ideas: deduped, removed } = dedupeIdeas(normalized);
  const existing = loadExisting();
  const ideas = deduped.map((idea) =>
    mergeEnrichment(idea, existing.get(idea.canonicalId)),
  );

  for (const idea of ideas) {
    ideaSchema.parse(idea);
  }

  mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  writeFileSync(
    OUT_PATH,
    JSON.stringify(
      { ideas, removed, importedAt: new Date().toISOString() },
      null,
      2,
    ),
  );

  console.log(`Parsed: ${parsed.length}`);
  console.log(`Normalized: ${normalized.length}`);
  console.log(`Deduped: ${ideas.length} (removed ${removed.length})`);
  console.log(`Written: ${OUT_PATH}`);
}

main();
