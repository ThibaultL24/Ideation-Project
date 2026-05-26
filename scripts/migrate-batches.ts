// scripts/migrate-batches.ts
import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import type { Idea } from "../src/lib/ideas/schema";

const ROOT = path.resolve(import.meta.dirname, "..");
const BATCH_SIZE = Number(process.env["BATCH_SIZE"] ?? "50");
const COOLDOWN_MS = Number(process.env["BATCH_COOLDOWN_MS"] ?? "120000");
const TRIPLE_DELAY_MS = process.env["TRIPLE_DELAY_MS"] ?? "4000";

function parseTotal(): number {
  const arg = process.argv.find((a) => a.startsWith("--total="));
  if (arg) return Number(arg.split("=")[1]);
  const payload = JSON.parse(
    readFileSync(path.join(ROOT, "data/normalized/ideas.json"), "utf8"),
  ) as { ideas: Idea[] };
  return payload.ideas.length;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const total = parseTotal();
  const startOffset = Number(
    process.argv.find((a) => a.startsWith("--start-offset="))?.split("=")[1] ??
      process.env["BATCH_START_OFFSET"] ??
      "0",
  );
  const packs: Array<{ offset: number; limit: number }> = [];

  for (let offset = startOffset; offset < total; offset += BATCH_SIZE) {
    packs.push({ offset, limit: Math.min(BATCH_SIZE, total - offset) });
  }

  mkdirSync(path.join(ROOT, "data/reports/batches"), { recursive: true });

  const summary: Array<{
    offset: number;
    limit: number;
    exitCode: number;
    reportPath: string;
  }> = [];

  console.log(
    `Migration en ${packs.length} lots de ≤${BATCH_SIZE} (total ${total}, cooldown ${COOLDOWN_MS}ms)`,
  );

  for (let i = 0; i < packs.length; i++) {
    const { offset, limit } = packs[i];
    const label = `pack ${i + 1}/${packs.length} (offset ${offset}, limit ${limit})`;

    if (i > 0 && COOLDOWN_MS > 0) {
      console.log(`\nCooldown ${COOLDOWN_MS}ms avant ${label}…`);
      await sleep(COOLDOWN_MS);
    }

    console.log(`\n=== ${label} ===`);
    const cmd = `pnpm migrate:batch -- --limit=${limit} --offset=${offset} --sdk-batch`;
    let exitCode = 0;
    try {
      execSync(cmd, {
        cwd: ROOT,
        stdio: "inherit",
        env: {
          ...process.env,
          TRIPLE_DELAY_MS,
          MIGRATE_OFFSET: String(offset),
          MIGRATE_LIMIT: String(limit),
        },
      });
    } catch {
      exitCode = 1;
    }

    const reportPath = `data/reports/migration-batch-sdk-${offset}-${offset + limit - 1}.json`;
    summary.push({ offset, limit, exitCode, reportPath });
  }

  const outPath = path.join(ROOT, "data/reports/batches/summary.json");
  writeFileSync(outPath, JSON.stringify({ batchSize: BATCH_SIZE, total, summary }, null, 2));
  console.log(`\nRésumé: ${outPath}`);

  const failed = summary.filter((s) => s.exitCode !== 0);
  if (failed.length > 0) {
    console.error(`${failed.length} lot(s) en échec`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
