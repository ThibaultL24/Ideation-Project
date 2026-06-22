// scripts/verify-onchain.ts
import "dotenv/config";
import { multiVaultIsTermCreated } from "@0xintuition/protocol";
import type { Hex } from "viem";
import { getNetworkConfig, resolveNetwork } from "../src/lib/intuition/config";
import { createIntuitionClients } from "../src/lib/intuition/client";
import { verifyAtomQueryable } from "../src/lib/intuition/graphql";

async function main() {
  const termId = process.argv[2] as Hex | undefined;
  if (!termId) {
    console.log("Usage: pnpm verify:onchain <atom_term_id>");
    process.exit(1);
  }

  const network = resolveNetwork();
  const config = getNetworkConfig(network);
  const clients = await createIntuitionClients(network);

  const onchain = await multiVaultIsTermCreated(
    {
      address: config.multivault,
      publicClient: clients.publicClient,
      walletClient: clients.writeConfig?.walletClient,
    } as never,
    { args: [termId] },
  );

  const graphql = await verifyAtomQueryable(config, termId);

  console.log({ termId, network, onchain, graphql });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
