// src/lib/intuition/migration-atoms.ts
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const REPORT_PATH = path.join(
  process.cwd(),
  "data/reports/migration-batch-sdk-retry.json",
);

interface MigrationEntry {
  canonicalId: string;
  termId: string;
  ipfsUri?: string;
}

let cache: Map<string, string> | null = null;

export function getMigrationAtomTermId(canonicalId: string): string | undefined {
  if (!cache) {
    cache = new Map();
    if (existsSync(REPORT_PATH)) {
      const raw = JSON.parse(readFileSync(REPORT_PATH, "utf8")) as {
        ideaAtomIds?: MigrationEntry[];
      };
      for (const entry of raw.ideaAtomIds ?? []) {
        cache.set(entry.canonicalId, entry.termId);
      }
    }
  }
  return cache.get(canonicalId);
}
