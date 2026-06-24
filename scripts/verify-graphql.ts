// scripts/verify-graphql.ts — vérifie que atoms et triples sont queryables via GraphQL uniquement
import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { Hex } from "viem";
import {
  getNetworkConfig,
  resolveNetwork,
} from "../src/lib/intuition/config";
import { resolveCatalogAnchorIds } from "../src/lib/intuition/catalog-graph";
import { loadMigrationAtomMap } from "../src/lib/ideas/migration-reports";
import {
  countAtomsInGraphql,
  countTriplesInGraphql,
  findAtomTermIdsInGraphql,
  findTripleSubjectsInGraphql,
} from "../src/lib/intuition/graphql";

const ROOT = path.resolve(import.meta.dirname, "..");
const REPORTS_DIR = path.join(ROOT, "data/reports");
const OUT_PATH = path.join(REPORTS_DIR, "migration-verify-graphql.json");

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

  const atomMap = loadMigrationAtomMap(network);
  const termIdToCanonical = invertMap(atomMap);
  const expectedTermIds = [...atomMap.values()];

  const anchors = await resolveCatalogAnchorIds(config);
  const predicateId = anchors.predicateId as Hex;
  const objectId = anchors.objectId as Hex;

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
