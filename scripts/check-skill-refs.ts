// scripts/check-skill-refs.ts
// Validates that every file the intuition-ideation skill depends on actually exists,
// and that the data files it reads are parseable. Run: pnpm check:skill
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKILL_DIR = ".cursor/skills/intuition-ideation";

const REQUIRED_FILES = [
  `${SKILL_DIR}/SKILL.md`,
  `${SKILL_DIR}/references/intuition-protocol-skill.md`,
  `${SKILL_DIR}/references/idea-template.md`,
  `${SKILL_DIR}/references/github-submission-format.md`,
  `${SKILL_DIR}/references/intuition-basics.md`,
  "data/normalized/ideas.json",
  "data/reports/migration-batch-sdk-retry.json",
  "data/reports/migration-verify-graphql.json",
];

const REQUIRED_SKILL_SECTIONS = [
  "## Step 1",
  "## Step 2",
  "## Step 3",
  "## Step 4",
  "## Step 5",
  "Enhanced 3B/3C Modes",
  "BrainstormDraft",
];

let failures = 0;

function fail(message: string) {
  failures += 1;
  console.error(`  ✗ ${message}`);
}

function ok(message: string) {
  console.log(`  ✓ ${message}`);
}

console.log("Checking required files…");
for (const file of REQUIRED_FILES) {
  if (existsSync(path.join(ROOT, file))) ok(file);
  else fail(`missing: ${file}`);
}

console.log("\nChecking SKILL.md sections…");
const skillPath = path.join(ROOT, SKILL_DIR, "SKILL.md");
if (existsSync(skillPath)) {
  const skill = readFileSync(skillPath, "utf8");
  for (const section of REQUIRED_SKILL_SECTIONS) {
    if (skill.includes(section)) ok(section);
    else fail(`SKILL.md missing section: ${section}`);
  }
}

console.log("\nChecking data files parse…");
const ideasPath = path.join(ROOT, "data/normalized/ideas.json");
if (existsSync(ideasPath)) {
  try {
    const payload = JSON.parse(readFileSync(ideasPath, "utf8")) as {
      ideas?: unknown[];
    };
    const count = payload.ideas?.length ?? 0;
    if (count >= 300) ok(`ideas.json parses (${count} ideas)`);
    else fail(`ideas.json has only ${count} ideas (expected >= 300)`);
  } catch (e) {
    fail(`ideas.json unparseable: ${e instanceof Error ? e.message : e}`);
  }
}

const retryPath = path.join(ROOT, "data/reports/migration-batch-sdk-retry.json");
if (existsSync(retryPath)) {
  try {
    const report = JSON.parse(readFileSync(retryPath, "utf8")) as {
      ideaAtomIds?: unknown[];
    };
    const count = report.ideaAtomIds?.length ?? 0;
    if (count > 0) ok(`migration-batch-sdk-retry.json parses (${count} atom ids)`);
    else fail("migration-batch-sdk-retry.json has no ideaAtomIds");
  } catch (e) {
    fail(`retry report unparseable: ${e instanceof Error ? e.message : e}`);
  }
}

console.log(
  failures === 0
    ? "\nAll skill references OK."
    : `\n${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
