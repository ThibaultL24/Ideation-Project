// scripts/verify-migration-complete.ts — vérifie atoms + triples + GraphQL pour toutes les idées migrées
import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { multiVaultIsTermCreated } from "@0xintuition/protocol";
import { calculateTripleId } from "@0xintuition/sdk";
import type { Hex } from "viem";
import {
  getNetworkConfig,
  resolveNetwork,
} from "../src/lib/intuition/config";
import { resolveCatalogAnchorIds } from "../src/lib/intuition/catalog-graph";
import { loadMigrationAtomMap } from "../src/lib/ideas/migration-reports";
import { createIntuitionClients } from "../src/lib/intuition/client";
import { verifyAtomQueryable } from "../src/lib/intuition/graphql";

const ROOT = path.resolve(import.meta.dirname, "..");
const REPORTS_DIR = path.join(ROOT, "data/reports");
const OUT_PATH = path.join(REPORTS_DIR, "migration-verify-complete.json");

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const network = resolveNetwork();
  const config = getNetworkConfig(network);
  const clients = await createIntuitionClients(network);

  const ideasPayload = JSON.parse(
    readFileSync(path.join(ROOT, "data/normalized/ideas.json"), "utf8"),
  ) as { ideas: Array<{ canonicalId: string }> };
  const totalIdeas = ideasPayload.ideas.length;

  const atomMap = loadMigrationAtomMap(network);
  console.log(`=== Vérification migration ${network} ===`);
  console.log(`Idées canoniques: ${totalIdeas}`);
  console.log(`Atoms dans rapports: ${atomMap.size}`);

  const anchors = await resolveCatalogAnchorIds(config);
  const predicateId = anchors.predicateId as Hex;
  const objectId = anchors.objectId as Hex;

  console.log(`Predicate: ${predicateId}`);
  console.log(`Object: ${objectId}\n`);

  const delayMs = Number(process.env["VERIFY_DELAY_MS"] ?? "200");
  const missingAtoms: string[] = [];
  const missingOnchain: string[] = [];
  const missingGraphql: string[] = [];
  const missingTriples: string[] = [];
  let verified = 0;

  const writeConfig = clients.writeConfig
    ? {
        address: config.multivault,
        publicClient: clients.publicClient,
        walletClient: clients.writeConfig.walletClient,
      }
    : {
        address: config.multivault,
        publicClient: clients.publicClient,
      };

  for (const idea of ideasPayload.ideas) {
    const termId = atomMap.get(idea.canonicalId);
    if (!termId) {
      missingAtoms.push(idea.canonicalId);
      continue;
    }

    let onchain = false;
    let graphql = false;
    let tripleOnchain = false;

    try {
      onchain = await multiVaultIsTermCreated(writeConfig as never, {
        args: [termId],
      });
    } catch {
      onchain = false;
    }

    try {
      graphql = await verifyAtomQueryable(config, termId);
    } catch {
      graphql = false;
    }

    const tripleId = calculateTripleId(termId, predicateId, objectId) as Hex;
    try {
      tripleOnchain = await multiVaultIsTermCreated(writeConfig as never, {
        args: [tripleId],
      });
    } catch {
      tripleOnchain = false;
    }

    if (!onchain) missingOnchain.push(idea.canonicalId);
    if (!graphql) missingGraphql.push(idea.canonicalId);
    if (!tripleOnchain) missingTriples.push(idea.canonicalId);
    if (onchain && graphql && tripleOnchain) verified += 1;

    if (delayMs > 0) await sleep(delayMs);
  }

  const report = {
    network,
    totalIdeas,
    atomsInReports: atomMap.size,
    fullyVerified: verified,
    missingFromReports: missingAtoms,
    missingOnchain,
    missingGraphql,
    missingTriples,
    predicateId,
    objectId,
    ok:
      missingAtoms.length === 0 &&
      missingOnchain.length === 0 &&
      missingGraphql.length === 0 &&
      missingTriples.length === 0,
    generatedAt: new Date().toISOString(),
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(report, null, 2));

  console.log("\n=== Résultat ===");
  console.log(`Fully verified (atom+graphql+triple): ${verified}/${totalIdeas}`);
  console.log(`Missing from reports: ${missingAtoms.length}`);
  console.log(`Missing onchain atom: ${missingOnchain.length}`);
  console.log(`Missing GraphQL: ${missingGraphql.length}`);
  console.log(`Missing triple onchain: ${missingTriples.length}`);
  console.log(`OK: ${report.ok}`);
  console.log(`Report: ${OUT_PATH}`);

  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
