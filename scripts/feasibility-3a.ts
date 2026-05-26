// scripts/feasibility-3a.ts
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  calculateAtomId,
  pinThing,
} from "@0xintuition/sdk";
import {
  multiVaultGetAtomCost,
  multiVaultGetTripleCost,
  multiVaultIsTermCreated,
} from "@0xintuition/protocol";
import { formatEther, toHex, type Hex } from "viem";
import {
  BOUNTY_PREDICATE_LABEL,
  getNetworkConfig,
  MAINNET_INTUITION_PROTOCOL_TERM_ID,
  resolveNetwork,
} from "../src/lib/intuition/config";
import { createIntuitionClients, getNativeBalance } from "../src/lib/intuition/client";
import { findAtomsByLabel, pickCanonicalAtom } from "../src/lib/intuition/graphql";
import { ideaToPinThing } from "../src/lib/intuition/idea-thing";
import type { Idea } from "../src/lib/ideas/schema";

const ROOT = path.resolve(import.meta.dirname, "..");

async function main() {
  const network = resolveNetwork();
  const config = getNetworkConfig(network);
  const clients = await createIntuitionClients(network);

  console.log("=== Mission 3A — Feasibility (@0xintuition/sdk) ===\n");
  console.log(`Network: ${config.network} (chain ${config.chainId})`);
  console.log(`GraphQL: ${config.graphql}`);
  console.log(`MultiVault: ${config.multivault}`);
  console.log("SDK: createAtomFromThing, createTripleStatement, batchCreateAtomsFromThings\n");

  const payload = JSON.parse(
    readFileSync(path.join(ROOT, "data/normalized/ideas.json"), "utf8"),
  ) as { ideas: Idea[] };
  const sample = payload.ideas[0];
  if (!sample) throw new Error("No ideas in normalized JSON");

  console.log("1) pinThing via SDK");
  const testUri = await pinThing(ideaToPinThing(sample));
  if (!testUri) throw new Error("SDK pinThing returned null");
  console.log(`   OK — ${testUri}`);

  const previewAtomId = calculateAtomId(toHex(testUri)) as Hex;
  console.log(`   Preview atom ID: ${previewAtomId}\n`);

  if (!clients.writeConfig) {
    console.log("2) Costs — skipped (no wallet)");
  } else {
    const atomCost = await multiVaultGetAtomCost(clients.writeConfig);
    const tripleCost = await multiVaultGetTripleCost(clients.writeConfig);
    const perIdeaWei = atomCost * BigInt(2) + tripleCost;
    console.log("2) On-chain costs");
    console.log(`   atomCost: ${formatEther(atomCost)} ${config.nativeSymbol}`);
    console.log(`   tripleCost: ${formatEther(tripleCost)} ${config.nativeSymbol}`);
    console.log(`   ~per idea: ${formatEther(perIdeaWei)}`);
    console.log(
      `   ~362 ideas (1 predicate): ${formatEther(atomCost + atomCost * BigInt(362) + tripleCost * BigInt(362))}\n`,
    );
  }

  console.log("3) Existing graph terms");
  const predicateRows = await findAtomsByLabel(config, BOUNTY_PREDICATE_LABEL);
  const predicate = pickCanonicalAtom(predicateRows);
  console.log(
    `   Predicate "${BOUNTY_PREDICATE_LABEL}": ${predicate?.term_id ?? "NOT FOUND"}`,
  );

  if (network === "mainnet") {
    console.log(`   Object "Intuition Protocol": ${MAINNET_INTUITION_PROTOCOL_TERM_ID}`);
  } else {
    const intuitionRows = await findAtomsByLabel(config, "Intuition Protocol");
    const intuition = pickCanonicalAtom(intuitionRows);
    console.log(`   Object "Intuition Protocol": ${intuition?.term_id ?? "NOT FOUND"}`);
  }

  if (clients.writeConfig) {
    const exists = await multiVaultIsTermCreated(clients.writeConfig, {
      args: [previewAtomId],
    });
    console.log(`   Sample idea onchain: ${exists}\n`);
  }

  console.log("4) Wallet");
  if (!clients.writeConfig || !clients.account) {
    console.log("   BLOCKED — set INTUITION_PRIVATE_KEY in .env");
    console.log("   pnpm publish:one stake-review");
    console.log("   pnpm migrate:batch -- --limit=10 --sdk-batch");
    process.exitCode = 2;
    return;
  }

  const balance = await getNativeBalance(clients);
  console.log(`   Wallet: ${clients.account}`);
  console.log(`   Balance: ${formatEther(balance)} ${config.nativeSymbol}`);
  console.log("\n✅ Ready — SDK path aligned with official docs");
  console.log("   pnpm publish:one stake-review");
  console.log("   pnpm migrate:batch -- --limit=25 --sdk-batch");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
