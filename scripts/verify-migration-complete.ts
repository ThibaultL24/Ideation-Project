// scripts/verify-migration-complete.ts — vérifie atoms + triples + GraphQL pour toutes les idées migrées
import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { multiVaultIsTermCreated } from "@0xintuition/protocol";
import { calculateTripleId } from "@0xintuition/sdk";
import type { Hex } from "viem";
import {
  getNetworkConfig,
  resolveNetwork,
  IDEA_PREDICATE_LABEL,
} from "../src/lib/intuition/config";
import { createIntuitionClients } from "../src/lib/intuition/client";
import {
  findAtomsByLabel,
  pickCanonicalAtom,
  verifyAtomQueryable,
} from "../src/lib/intuition/graphql";
import type { BatchPublishReport } from "../src/lib/intuition/batch-publish";

const ROOT = path.resolve(import.meta.dirname, "..");
const REPORTS_DIR = path.join(ROOT, "data/reports");
const OUT_PATH = path.join(REPORTS_DIR, "migration-verify-complete.json");

const TESTNET_PREDICATE =
  "0xc3e6f1bb243fa82208dbfb2b5b73cf11a1ad26b04e59fd275b163e244c7825b5" as Hex;
const TESTNET_OBJECT =
  "0xda797f4aa19c2b129bd3a33cdb8d260b94672fcdb295d04e2533dc02a994a3d8" as Hex;

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

function requireExists(p: string): boolean {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
}

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

  const atomMap = loadAtomIds();
  console.log(`=== Vérification migration ${network} ===`);
  console.log(`Idées canoniques: ${totalIdeas}`);
  console.log(`Atoms dans rapports: ${atomMap.size}`);

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
