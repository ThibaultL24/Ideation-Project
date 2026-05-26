// scripts/retry-triples.ts
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { BatchPublishReport } from "../src/lib/intuition/batch-publish";
import { retryMissingTriples } from "../src/lib/intuition/batch-publish";

const ROOT = path.resolve(import.meta.dirname, "..");
const REPORT_PATH =
  process.argv.find((a) => a.startsWith("--report="))?.split("=")[1] ??
  path.join(ROOT, "data/reports/migration-batch-sdk.json");

const TESTNET_PREDICATE =
  "0xc3e6f1bb243fa82208dbfb2b5b73cf11a1ad26b04e59fd275b163e244c7825b5" as const;
const TESTNET_OBJECT =
  "0xda797f4aa19c2b129bd3a33cdb8d260b94672fcdb295d04e2533dc02a994a3d8" as const;
const TRIPLE_COST_WEI = 1_000_000_002_000_000n;

async function main() {
  const initialDelayMs = Number(process.env["RETRY_INITIAL_DELAY_MS"] ?? "120000");
  if (initialDelayMs > 0) {
    console.log(`Waiting ${initialDelayMs}ms for RPC cooldown…`);
    await new Promise((r) => setTimeout(r, initialDelayMs));
  }

  const report = JSON.parse(
    readFileSync(REPORT_PATH, "utf8"),
  ) as BatchPublishReport;

  console.log(`Retry triples: ${report.ideaAtomIds.length} atoms (${report.network})`);
  console.log(`Previous failures: ${report.failed.length}`);

  const result = await retryMissingTriples({
    ideaAtomIds: report.ideaAtomIds,
    network: report.network,
    predicateTermId: TESTNET_PREDICATE,
    objectTermId: TESTNET_OBJECT,
    tripleCostWei: TRIPLE_COST_WEI,
  });

  const merged: BatchPublishReport = {
    ...report,
    triplesCreated: report.triplesCreated + result.triplesCreated,
    failed: result.failed,
    txHashes: [...report.txHashes, ...result.txHashes],
  };

  const outPath = path.join(ROOT, "data/reports/migration-batch-sdk-retry.json");
  writeFileSync(outPath, JSON.stringify(merged, null, 2));

  console.log(JSON.stringify({ ...result, reportPath: outPath }, null, 2));
  if (result.failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
