// scripts/publish-one-idea.ts
import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { Idea } from "../src/lib/ideas/schema";
import { publishIdeaOnchain } from "../src/lib/intuition/publish-idea";

const ROOT = path.resolve(import.meta.dirname, "..");

function loadIdeas(): Idea[] {
  const raw = readFileSync(
    path.join(ROOT, "data/normalized/ideas.json"),
    "utf8",
  );
  return (JSON.parse(raw) as { ideas: Idea[] }).ideas;
}

async function main() {
  const slugArg = process.argv[2]?.replace(/^--/, "");
  const ideas = loadIdeas();
  const idea = slugArg
    ? ideas.find((i) => i.slug === slugArg || i.canonicalId === slugArg)
    : ideas[0];

  if (!idea) {
    throw new Error(`Idea not found: ${slugArg ?? "(default first)"}`);
  }

  console.log(`Publishing: ${idea.title} (${idea.canonicalId})`);
  const result = await publishIdeaOnchain({ idea });

  const outDir = path.join(ROOT, "data/reports/published");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${idea.canonicalId}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log("\n=== Published ===");
  console.log(JSON.stringify(result, null, 2));
  console.log(`\nReport: ${outPath}`);
  console.log(
    `Explorer atom: ${process.env.INTUITION_NETWORK === "mainnet" ? "https://explorer.intuition.systems" : "https://testnet.explorer.intuition.systems"}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
