// src/lib/ideas/migration-reports.ts
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Hex } from "viem";
import type { IntuitionNetwork } from "@/lib/intuition/config";
import type { BatchPublishReport } from "@/lib/intuition/batch-publish";

const REPORTS_DIR = path.join(process.cwd(), "data/reports");

function readReport(filePath: string): BatchPublishReport | null {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as BatchPublishReport;
  } catch {
    return null;
  }
}

/** canonicalId → termId for the active network (from migration batch reports). */
export function loadMigrationAtomMap(
  network: IntuitionNetwork,
): Map<string, Hex> {
  const byCanonical = new Map<string, Hex>();

  const retryPath = path.join(REPORTS_DIR, "migration-batch-sdk-retry.json");
  if (existsSync(retryPath)) {
    const retry = readReport(retryPath);
    if (retry && (!retry.network || retry.network === network)) {
      for (const row of retry.ideaAtomIds ?? []) {
        byCanonical.set(row.canonicalId, row.termId as Hex);
      }
      if (byCanonical.size > 0) return byCanonical;
    }
  }

  if (!existsSync(REPORTS_DIR)) return byCanonical;

  for (const file of readdirSync(REPORTS_DIR)) {
    if (!file.startsWith("migration-batch-sdk-") || file === "migration-batch-sdk-retry.json") {
      continue;
    }
    if (!file.endsWith(".json")) continue;
    const report = readReport(path.join(REPORTS_DIR, file));
    if (!report || report.network !== network) continue;
    for (const row of report.ideaAtomIds ?? []) {
      byCanonical.set(row.canonicalId, row.termId as Hex);
    }
  }

  return byCanonical;
}

/** termId → canonicalId */
export function invertAtomMap(map: Map<string, Hex>): Map<string, string> {
  const out = new Map<string, string>();
  for (const [canonicalId, termId] of map) {
    out.set(termId.toLowerCase(), canonicalId);
  }
  return out;
}
