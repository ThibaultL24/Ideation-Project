// scripts/import-ideas.ts
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import {
  parseIdeasFromText,
  normalizeIdeas,
  dedupeIdeas,
  ideaSchema,
} from "../src/lib/ideas";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_PATH = path.join(ROOT, "data/raw/ideas.txt");
const OUT_PATH = path.join(ROOT, "data/normalized/ideas.json");

function main() {
  const raw = readFileSync(RAW_PATH, "utf8");
  const parsed = parseIdeasFromText(raw);
  const normalized = normalizeIdeas(parsed);
  const { ideas, removed } = dedupeIdeas(normalized);

  for (const idea of ideas) {
    ideaSchema.parse(idea);
  }

  mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  writeFileSync(
    OUT_PATH,
    JSON.stringify({ ideas, removed, importedAt: new Date().toISOString() }, null, 2),
  );

  console.log(`Parsed: ${parsed.length}`);
  console.log(`Normalized: ${normalized.length}`);
  console.log(`Deduped: ${ideas.length} (removed ${removed.length})`);
  console.log(`Written: ${OUT_PATH}`);
}

main();
