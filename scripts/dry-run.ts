// scripts/dry-run.ts
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import {
  parseIdeasFromText,
  normalizeIdeas,
  dedupeIdeas,
  generateIdeaMarkdown,
  generateIpfsJson,
  githubReadmePathForIdea,
  type Idea,
  type MigrationReport,
} from "../src/lib/ideas";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_PATH = path.join(ROOT, "data/raw/ideas.txt");
const NORMALIZED_PATH = path.join(ROOT, "data/normalized/ideas.json");
const MARKDOWN_DIR = path.join(ROOT, "data/normalized/markdown");
const IPFS_DIR = path.join(ROOT, "data/normalized/ipfs");
const REPORT_PATH = path.join(ROOT, "data/reports/migration-report.json");

function loadIdeas(): { ideas: Idea[]; removedCount: number } {
  if (existsSync(NORMALIZED_PATH)) {
    const payload = JSON.parse(readFileSync(NORMALIZED_PATH, "utf8")) as {
      ideas: Idea[];
      removed?: unknown[];
    };
    return {
      ideas: payload.ideas,
      removedCount: payload.removed?.length ?? 0,
    };
  }

  const raw = readFileSync(RAW_PATH, "utf8");
  const parsed = parseIdeasFromText(raw);
  const normalized = normalizeIdeas(parsed);
  const { ideas, removed } = dedupeIdeas(normalized);
  return { ideas, removedCount: removed.length };
}

function countByCategory(ideas: Idea[]): Record<string, number> {
  return ideas.reduce<Record<string, number>>((acc, idea) => {
    acc[idea.category] = (acc[idea.category] ?? 0) + 1;
    return acc;
  }, {});
}

function main() {
  const { ideas, removedCount } = loadIdeas();
  const migrationDate = new Date("2026-05-25T00:00:00.000Z");

  mkdirSync(MARKDOWN_DIR, { recursive: true });
  mkdirSync(IPFS_DIR, { recursive: true });
  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });

  for (const idea of ideas) {
    const mdPath = path.join(
      MARKDOWN_DIR,
      `${idea.canonicalId}.md`,
    );
    const ipfsPath = path.join(IPFS_DIR, `${idea.canonicalId}.json`);
    writeFileSync(mdPath, generateIdeaMarkdown(idea, migrationDate));
    writeFileSync(
      ipfsPath,
      JSON.stringify(generateIpfsJson(idea, migrationDate), null, 2),
    );
    idea.github = {
      path: githubReadmePathForIdea(idea, migrationDate),
    };
  }

  const report: MigrationReport = {
    totalIdeas: ideas.length,
    normalized: ideas.length,
    duplicatesRemoved: removedCount,
    githubMarkdownGenerated: ideas.length,
    ipfsJsonGenerated: ideas.length,
    byCategory: countByCategory(ideas),
    failed: [],
    network: "dry-run",
    generatedAt: new Date().toISOString(),
  };

  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  writeFileSync(
    NORMALIZED_PATH,
    JSON.stringify({ ideas, report }, null, 2),
  );

  console.log("=== Migration dry-run ===");
  console.log(`Ideas: ${report.totalIdeas}`);
  console.log(`Markdown files: ${report.githubMarkdownGenerated}`);
  console.log(`IPFS JSON files: ${report.ipfsJsonGenerated}`);
  console.log(`Duplicates removed: ${report.duplicatesRemoved}`);
  console.log(`Report: ${REPORT_PATH}`);
  console.log("Categories:");
  for (const [category, count] of Object.entries(report.byCategory).sort(
    (a, b) => a[0].localeCompare(b[0]),
  )) {
    console.log(`  - ${category}: ${count}`);
  }
}

main();
