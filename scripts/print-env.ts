// scripts/print-env.ts
import { getGithubPublishEnv } from "../src/lib/env/github-config";
import { describeNetworkEnv } from "../src/lib/env/network";
import {
  getNetworkConfig,
  getNetworkLabel,
  getPortalExplorerUrl,
} from "../src/lib/intuition/config";

const network = describeNetworkEnv();
const config = getNetworkConfig();

console.log("Resolved environment (from .env + defaults)\n");
console.log("── Intuition network ──");
console.log(`  INTUITION_NETWORK     → ${config.network} (${getNetworkLabel()})`);
console.log(`  chainId               → ${config.chainId}`);
console.log(`  native token          → ${config.nativeSymbol}`);
console.log(`  rpc                   → ${config.rpc}`);
console.log(`  graphql               → ${config.graphql}`);
console.log(`  explorer              → ${config.explorer}`);
console.log(`  portal                → ${getPortalExplorerUrl()}`);
console.log(`  hub                   → ${config.hub}`);
console.log(`  hint                  → ${network.hint}`);
if (network.rpcOverride) {
  console.log(`  rpc override          → ${network.rpcOverride}`);
}

console.log("\n── GitHub publication ──");
const gh = getGithubPublishEnv();
console.log(`  GITHUB_TARGET_REPO    → ${gh.targetRepo} (upstream — users fork this)`);
console.log(`  GITHUB_BASE_BRANCH    → ${gh.baseBranch} (PR target branch)`);
console.log(
  `  OAuth configured      → ${Boolean(process.env.GITHUB_OAUTH_CLIENT_ID?.trim() && process.env.GITHUB_OAUTH_CLIENT_SECRET?.trim())}`,
);
console.log(
  `  Bot fallback (CI)     → ${gh.botToken && gh.botPublishRepo ? gh.botPublishRepo : "disabled"}`,
);
console.log(
  `  NEXT_PUBLIC_APP_URL   → ${process.env.NEXT_PUBLIC_APP_URL?.trim() || "(not set — defaults to localhost:3000)"}`,
);

console.log("\nSwitch network: set INTUITION_NETWORK=mainnet|testnet in .env, restart dev server.");
console.log("Full reference: .env.example\n");
