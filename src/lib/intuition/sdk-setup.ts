// src/lib/intuition/sdk-setup.ts
import { configureClient } from "@0xintuition/graphql";
import type { IntuitionNetworkConfig } from "./config";

let configuredFor: string | null = null;

/** SDK pinThing defaults to mainnet GraphQL unless configureClient is called first. */
export function ensureSdkGraphqlClient(networkConfig: IntuitionNetworkConfig): void {
  if (configuredFor === networkConfig.graphql) return;
  configureClient({ apiUrl: networkConfig.graphql });
  configuredFor = networkConfig.graphql;
}
