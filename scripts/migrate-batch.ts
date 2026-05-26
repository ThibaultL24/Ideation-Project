// scripts/migrate-batch.ts
import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { Idea } from "../src/lib/ideas/schema";
import { publishIdeaOnchain } from "../src/lib/intuition/publish-idea";
import { publishIdeasBatch } from "../src/lib/intuition/batch-publish";
import { resolveNetwork } from "../src/lib/intuition/config";

const ROOT = path.resolve(import.meta.dirname, "..");

function parseLimit(): number {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  if (arg) return Number(arg.split("=")[1]);
  return Number(process.env["MIGRATE_LIMIT"] ?? "5");
}

function parseOffset(): number {
  const arg = process.argv.find((a) => a.startsWith("--offset="));
  if (arg) return Number(arg.split("=")[1]);
  return Number(process.env["MIGRATE_OFFSET"] ?? "0");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const useSdkBatch = process.argv.includes("--sdk-batch");
  const limit = parseLimit();
  const offset = parseOffset();

  const payload = JSON.parse(
    readFileSync(path.join(ROOT, "data/normalized/ideas.json"), "utf8"),
  ) as { ideas: Idea[] };

  const slice = payload.ideas.slice(offset, offset + limit);
  const network = resolveNetwork();

  if (dryRun) {
    console.log(`Dry-run: ${slice.length} ideas on ${network}`);
    console.log(useSdkBatch ? "Mode: SDK batch (batchCreateAtomsFromThings)" : "Mode: sequential (publishIdeaOnchain)");
    return;
  }

  mkdirSync(path.join(ROOT, "data/reports"), { recursive: true });

  if (useSdkBatch) {
    console.log(
      `SDK batch publish: ${slice.length} ideas (offset ${offset}, limit ${limit})`,
    );
    const report = await publishIdeasBatch({ ideas: slice, network });
    const outPath = path.join(
      ROOT,
      `data/reports/migration-batch-sdk-${offset}-${offset + slice.length - 1}.json`,
    );
    writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    console.log(`Report: ${outPath}`);
    return;
  }

  const report = {
    network,
    limit: slice.length,
    published: 0,
    atomsCreated: 0,
    triplesCreated: 0,
    failed: [] as Array<{ canonicalId: string; reason: string }>,
    results: [] as unknown[],
  };

  for (const idea of slice) {
    try {
      console.log(`\n→ ${idea.title}`);
      const result = await publishIdeaOnchain({ idea, network });
      if (result.ideaAtomCreated) report.atomsCreated += 1;
      if (result.tripleCreated) report.triplesCreated += 1;
      report.published += 1;
      report.results.push(result);
      await new Promise((r) =>
        setTimeout(r, Number(process.env["MIGRATE_DELAY_MS"] ?? 2000)),
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      report.failed.push({ canonicalId: idea.canonicalId, reason });
      console.error(`  FAIL: ${reason}`);
    }
  }

  const outPath = path.join(ROOT, "data/reports/migration-batch.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
