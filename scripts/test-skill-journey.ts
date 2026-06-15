// scripts/test-skill-journey.ts
// Smoke tests for the Hunch skill ↔ dapp journey. Run: pnpm test:skill-journey
// Requires: pnpm dev on http://localhost:3000 for API checks (skipped if down).
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { searchSimilarCatalog } from "../src/lib/ideas/similar-catalog";
import { buildPublishPlan } from "../src/lib/ideas/publish-plan";
import { loadNormalizedIdeas } from "../src/lib/ideas/load";
import { IDEATION_QUESTIONS } from "../src/lib/ideas/ideation-questions";
import type { Idea } from "../src/lib/ideas/schema";

const ROOT = process.cwd();
const BASE = process.env["HUNCH_BASE_URL"]?.trim() || "http://localhost:3000";

let failures = 0;

function fail(msg: string) {
  failures += 1;
  console.error(`  ✗ ${msg}`);
}

function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
}

async function checkApi(pathname: string, init?: RequestInit) {
  try {
    const res = await fetch(`${BASE}${pathname}`, {
      ...init,
      signal: AbortSignal.timeout(8000),
    });
    return res;
  } catch {
    return null;
  }
}

console.log("=== Hunch skill journey smoke tests ===\n");

// 1. Skill bridge doc
const bridge = path.join(
  ROOT,
  ".cursor/skills/intuition-ideation/references/hunch-dapp-bridge.md",
);
if (existsSync(bridge)) ok("hunch-dapp-bridge.md present");
else fail("missing hunch-dapp-bridge.md");

// 2. Five ideation questions aligned
if (IDEATION_QUESTIONS.length === 5) {
  ok(`ideation questions: ${IDEATION_QUESTIONS.length} (matches skill Step 2)`);
} else {
  fail(`expected 5 ideation questions, got ${IDEATION_QUESTIONS.length}`);
}

// 3. Similar catalog (Step 1 local)
try {
  const similar = await searchSimilarCatalog(
    "GPS historique culturel avec débats sur les faits",
    3,
  );
  if (similar.cards.length > 0) ok(`similar catalog: ${similar.cards.length} cards`);
  else fail("similar catalog returned no cards");
} catch (e) {
  fail(`similar catalog: ${e instanceof Error ? e.message : e}`);
}

// 4. Publish plan (Step 4)
const ideas = loadNormalizedIdeas();
const sample = ideas[0];
if (sample) {
  const plan = buildPublishPlan(sample, {
    problem: "Test problem statement for skill journey smoke test.",
    solution: "Test solution with enough detail for GitHub README generation.",
    users: "Early adopters on testnet.",
    intuitionFit: "Atoms for places, triples for historical claims, staking for conviction.",
    mvp: "Map + one debate thread.",
    risks: "Cold start.",
    challenge: "Must prove staking beats likes.",
    supportTriples: "",
    archetype: "reputation",
  });
  if (plan.prBody.includes("## Idea Preview") && plan.markdown.includes("#")) {
    ok("publish plan includes full PR preview body");
  } else {
    fail("publish plan missing Idea Preview in prBody");
  }
} else {
  fail("no ideas in catalog for publish plan test");
}

// 5. API smoke (optional — dev server)
console.log(`\nAPI checks (${BASE})…`);
const devUp = await checkApi("/");
if (!devUp) {
  console.log("  ⚠ dev server not running — skip API tests (start: pnpm dev)");
} else {
  ok("dev server reachable");

  const similarRes = await checkApi("/api/brainstorm/similar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent: "classement agents IA par vote communautaire" }),
  });
  if (similarRes?.ok) ok("POST /api/brainstorm/similar");
  else fail(`similar API ${similarRes?.status ?? "unreachable"}`);

  if (sample) {
    const stateRes = await checkApi(
      `/api/idea-state/${encodeURIComponent(sample.slug)}?verifyOnchain=false`,
    );
    if (stateRes?.ok) ok(`GET /api/idea-state/${sample.slug}`);
    else fail(`idea-state API ${stateRes?.status ?? "unreachable"}`);
  }
}

console.log("\n--- Manual skill test prompts (new chat) ---");
console.log(`
1. Idée libre:
   "J'ai une idée pour Intuition : GPS historique culturel + débats. Guide-moi avec la skill idéation."

2. Random catalogue:
   "Donne-moi une idée au hasard du catalogue onchain et vérifie GitHub + onchain."

3. Handoff dapp:
   "J'ai fini brainstorm dans Hunch, slug free-xxx. Aide-moi pour PR et onchain."

See: .cursor/skills/intuition-ideation/references/hunch-dapp-bridge.md
`);

console.log(
  failures === 0
    ? "\n✅ Skill journey smoke tests passed."
    : `\n❌ ${failures} failure(s).`,
);
process.exit(failures === 0 ? 0 : 1);
