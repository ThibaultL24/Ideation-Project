// src/lib/intuition/publish-idea.ts
/**
 * Server / script entry for on-chain publish.
 * The dapp UI signs with the user's wallet via publishIdeaWithWriteConfig.
 * This path keeps INTUITION_PRIVATE_KEY for migration scripts only.
 */
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import type { Idea } from "@/lib/ideas/schema";
import type { IntuitionNetwork } from "./config";
import { createIntuitionClients } from "./client";
import {
  publishIdeaWithWriteConfig,
  type PublishIdeaResult,
} from "./publish-execute";

export type { PublishIdeaResult };
export {
  previewOnchainPublish,
  publishIdeaWithWriteConfig,
} from "./publish-execute";

export async function publishIdeaOnchain(params: {
  idea: Idea;
  draft?: Partial<BrainstormDraft> | null;
  githubBlobUrl?: string;
  network?: IntuitionNetwork;
  dryRun?: boolean;
}): Promise<PublishIdeaResult> {
  if (params.dryRun) {
    return publishIdeaWithWriteConfig({
      idea: params.idea,
      draft: params.draft,
      githubBlobUrl: params.githubBlobUrl,
      network: params.network,
      dryRun: true,
    });
  }

  const clients = await createIntuitionClients(params.network);
  if (!clients.writeConfig) {
    throw new Error(
      "INTUITION_PRIVATE_KEY is required for script publish. The dapp uses the connected wallet instead.",
    );
  }

  return publishIdeaWithWriteConfig({
    idea: params.idea,
    draft: params.draft,
    githubBlobUrl: params.githubBlobUrl,
    network: params.network,
    writeConfig: clients.writeConfig,
  });
}
