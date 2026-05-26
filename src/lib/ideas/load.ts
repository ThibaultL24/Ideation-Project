// src/lib/ideas/load.ts
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { ideaSchema, type Idea } from "./schema";

const NORMALIZED_PATH = path.join(
  process.cwd(),
  "data/normalized/ideas.json",
);

export function loadNormalizedIdeas(): Idea[] {
  if (!existsSync(NORMALIZED_PATH)) return [];
  const payload = JSON.parse(readFileSync(NORMALIZED_PATH, "utf8")) as {
    ideas: unknown[];
  };
  return payload.ideas.map((item) => ideaSchema.parse(item));
}

export function getCategories(ideas: Idea[]): string[] {
  return [...new Set(ideas.map((idea) => idea.category))].sort((a, b) =>
    a.localeCompare(b),
  );
}
