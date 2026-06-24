// scripts/mainnet-preflight.ts
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { formatEther } from "viem";
import {
  multiVaultGetAtomCost,
  multiVaultGetTripleCost,
} from "@0xintuition/protocol";
import { createIntuitionClients, getNativeBalance } from "../src/lib/intuition/client";
import { pinThingForNetwork } from "../src/lib/intuition/pin-thing";
import { catalogIdeaToPinThing } from "../src/lib/intuition/idea-thing";
import type { Idea } from "../src/lib/ideas/schema";

const ROOT = path.resolve(import.meta.dirname, "..");

async function main() {
  const clients = await createIntuitionClients("mainnet");
  const { config, writeConfig, account, rpcUrl } = clients;

  console.log("=== Mainnet preflight (Bounty 3A) ===\n");
  console.log(`Network: ${config.network} (chain ${config.chainId})`);
  console.log(`RPC: ${rpcUrl}`);
  console.log(`GraphQL: ${config.graphql}`);
  console.log(`Account: ${account ?? "(no INTUITION_PRIVATE_KEY)"}`);

  if (account) {
    const balance = await getNativeBalance(clients);
    console.log(`Balance: ${formatEther(balance)} TRUST`);
  }

  const payload = JSON.parse(
    readFileSync(path.join(ROOT, "data/normalized/ideas.json"), "utf8"),
  ) as { ideas: Idea[] };
  const sample = payload.ideas[0];
  if (!sample) throw new Error("No ideas in catalog");

  console.log("\n1) pinThing (mainnet writes pin via testnet GraphQL)");
  try {
    const uri = await pinThingForNetwork(config, catalogIdeaToPinThing(sample));
    console.log(`   OK — ${uri}`);
  } catch (error) {
    console.log(
      `   FAIL — ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (writeConfig) {
    const atomCost = await multiVaultGetAtomCost(writeConfig);
    const tripleCost = await multiVaultGetTripleCost(writeConfig);
    const perIdea = atomCost + tripleCost;
    const total = atomCost * BigInt(payload.ideas.length) + tripleCost * BigInt(payload.ideas.length);
    console.log("\n3) Estimated costs");
    console.log(`   atomCost: ${formatEther(atomCost)} TRUST`);
    console.log(`   tripleCost: ${formatEther(tripleCost)} TRUST`);
    console.log(`   ~per idea: ${formatEther(perIdea)} TRUST`);
    console.log(`   ~${payload.ideas.length} ideas: ${formatEther(total)} TRUST`);
  } else {
    console.log("\n3) Costs — skipped (no wallet)");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
