// scripts/verify-graphql.ts — vérifie que atoms et triples sont queryables via GraphQL uniquement
import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Hex } from "viem";
import {
  getNetworkConfig,
  resolveNetwork,
  IDEA_PREDICATE_LABEL,
} from "../src/lib/intuition/config";
import {
  countAtomsInGraphql,
  countTriplesInGraphql,
  findAtomTermIdsInGraphql,
  findAtomsByLabel,
  findTripleSubjectsInGraphql,
  pickCanonicalAtom,
} from "../src/lib/intuition/graphql";
import type { BatchPublishReport } from "../src/lib/intuition/batch-publish";

const ROOT = path.resolve(import.meta.dirname, "..");
const REPORTS_DIR = path.join(ROOT, "data/reports");
const OUT_PATH = path.join(REPORTS_DIR, "migration-verify-graphql.json");

const TESTNET_PREDICATE =
  "0xc3e6f1bb243fa82208dbfb2b5b73cf11a1ad26b04e59fd275b163e244c7825b5" as Hex;
const TESTNET_OBJECT =
  "0xda797f4aa19c2b129bd3a33cdb8d260b94672fcdb295d04e2533dc02a994a3d8" as Hex;

function requireExists(p: string): boolean {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
}

function loadAtomIds(): Map<string, Hex> {
  const byCanonical = new Map<string, Hex>();

  const retryPath = path.join(REPORTS_DIR, "migration-batch-sdk-retry.json");
  if (requireExists(retryPath)) {
    const retry = JSON.parse(
      readFileSync(retryPath, "utf8"),
    ) as BatchPublishReport;
    for (const row of retry.ideaAtomIds) {
      byCanonical.set(row.canonicalId, row.termId as Hex);
    }
    return byCanonical;
  }

  for (const file of readdirSync(REPORTS_DIR)) {
    if (!file.startsWith("migration-batch-sdk-") || file === "migration-batch-sdk-retry.json") {
      continue;
    }
    if (!file.endsWith(".json")) continue;
    const report = JSON.parse(
      readFileSync(path.join(REPORTS_DIR, file), "utf8"),
    ) as BatchPublishReport;
    for (const row of report.ideaAtomIds ?? []) {
      byCanonical.set(row.canonicalId, row.termId as Hex);
    }
  }
  return byCanonical;
}

function invertMap(map: Map<string, Hex>): Map<string, string> {
  const out = new Map<string, string>();
  for (const [canonicalId, termId] of map) {
    out.set(termId, canonicalId);
  }
  return out;
}

async function main() {
  const network = resolveNetwork();
  const config = getNetworkConfig(network);

  const ideasPayload = JSON.parse(
    readFileSync(path.join(ROOT, "data/normalized/ideas.json"), "utf8"),
  ) as { ideas: Array<{ canonicalId: string }> };
  const totalIdeas = ideasPayload.ideas.length;

  const atomMap = loadAtomIds();
  const termIdToCanonical = invertMap(atomMap);
  const expectedTermIds = [...atomMap.values()];

  let predicateId = TESTNET_PREDICATE;
  let objectId = TESTNET_OBJECT;

  if (network === "testnet") {
    const predRows = await findAtomsByLabel(config, IDEA_PREDICATE_LABEL);
    const pred = pickCanonicalAtom(predRows);
    if (pred?.term_id) predicateId = pred.term_id as Hex;

    const objRows = await findAtomsByLabel(config, "Intuition Protocol");
    const obj = pickCanonicalAtom(objRows);
    if (obj?.term_id) objectId = obj.term_id as Hex;
  }

  console.log(`=== Vérification GraphQL ${network} ===`);
  console.log(`Endpoint: ${config.graphql}`);
  console.log(`Idées attendues: ${totalIdeas}`);
  console.log(`Term IDs dans rapports: ${expectedTermIds.length}`);
  console.log(`Predicate: ${predicateId}`);
  console.log(`Object: ${objectId}\n`);

  const missingFromReports = ideasPayload.ideas
    .filter((idea) => !atomMap.has(idea.canonicalId))
    .map((idea) => idea.canonicalId);

  console.log("Comptage aggregate…");
  const atomsAggregateCount = await countAtomsInGraphql(config, expectedTermIds);
  const triplesAggregateCount = await countTriplesInGraphql(
    config,
    expectedTermIds,
    predicateId,
    objectId,
  );

  console.log("Recherche détaillée par chunks…");
  const foundAtomTermIds = await findAtomTermIdsInGraphql(config, expectedTermIds);
  const foundTripleSubjects = await findTripleSubjectsInGraphql(
    config,
    expectedTermIds,
    predicateId,
    objectId,
  );

  const missingGraphqlAtoms = expectedTermIds
    .filter((termId) => !foundAtomTermIds.has(termId))
    .map((termId) => termIdToCanonical.get(termId) ?? termId);

  const missingGraphqlTriples = expectedTermIds
    .filter((termId) => !foundTripleSubjects.has(termId))
    .map((termId) => termIdToCanonical.get(termId) ?? termId);

  const report = {
    network,
    graphqlEndpoint: config.graphql,
    totalIdeas,
    termIdsInReports: expectedTermIds.length,
    atomsAggregateCount,
    triplesAggregateCount,
    atomsQueryable: foundAtomTermIds.size,
    triplesQueryable: foundTripleSubjects.size,
    missingFromReports,
    missingGraphqlAtoms,
    missingGraphqlTriples,
    predicateId,
    objectId,
    ok:
      missingFromReports.length === 0 &&
      missingGraphqlAtoms.length === 0 &&
      missingGraphqlTriples.length === 0,
    generatedAt: new Date().toISOString(),
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(report, null, 2));

  console.log("\n=== Résultat GraphQL ===");
  console.log(`Atoms queryables: ${report.atomsQueryable}/${expectedTermIds.length}`);
  console.log(`Triples queryables: ${report.triplesQueryable}/${expectedTermIds.length}`);
  console.log(`Aggregate atoms: ${atomsAggregateCount}`);
  console.log(`Aggregate triples: ${triplesAggregateCount}`);
  console.log(`Missing from reports: ${missingFromReports.length}`);
  console.log(`Missing atom queries: ${missingGraphqlAtoms.length}`);
  console.log(`Missing triple queries: ${missingGraphqlTriples.length}`);
  console.log(`OK: ${report.ok}`);
  console.log(`Report: ${OUT_PATH}`);

  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
