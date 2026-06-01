// src/lib/workshop/graph-context.ts
import type { GraphInspectResult } from "@/lib/intuition/graph-inspect";
import { graphInspectForPrompt } from "@/lib/intuition/graph-inspect";
import type { CatalogMatch } from "./discover-similar";
import type { GithubIssueHit } from "./github-discover";
import type { WorkshopGraphContext } from "./graph-context-types";

export type { WorkshopGraphContext } from "./graph-context-types";
export { graphContextForPrompt, semanticWarningsFromContext } from "./graph-context-types";

export function buildWorkshopGraphContext(input: {
  graphInspect: GraphInspectResult;
  catalogMatches: CatalogMatch[];
  githubIssues: GithubIssueHit[];
  overlap: WorkshopGraphContext["overlap"];
}): WorkshopGraphContext {
  return {
    capturedAt: new Date().toISOString(),
    searchTerms: input.graphInspect.searchTerms,
    catalogMatches: input.catalogMatches.slice(0, 8).map((m) => ({
      title: m.title,
      slug: m.slug,
      score: m.score,
      matchReason: m.matchReason,
    })),
    githubIssues: input.githubIssues.slice(0, 6).map((i) => ({
      title: i.title,
      url: i.url,
      state: i.state,
    })),
    overlap: input.overlap,
    graphInspect: input.graphInspect,
    graph: graphInspectForPrompt(input.graphInspect),
  };
}
