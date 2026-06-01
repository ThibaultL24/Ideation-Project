// src/lib/workshop/gather-research-context.ts
import { loadNormalizedIdeas } from "@/lib/ideas/load";
import { buildGraphInspect } from "@/lib/intuition/graph-inspect";
import type { CatalogMatch } from "@/lib/workshop/discover-similar";
import { overlapRiskLevel, rankCatalogIdeas } from "@/lib/workshop/discover-similar";
import { searchGithubIdeasRepo } from "@/lib/workshop/github-discover";
import { deriveAtomLabel } from "@/lib/workshop/atom-label";
import { buildWorkshopGraphContext, type WorkshopGraphContext } from "@/lib/workshop/graph-context";
import type { WorkshopSession } from "@/lib/workshop/session";

export interface GatheredResearchContext {
  ideaTitle: string;
  catalogMatches: CatalogMatch[];
  githubIssues: Awaited<ReturnType<typeof searchGithubIdeasRepo>>["issues"];
  graphContext: WorkshopGraphContext;
  overlapMessage: string;
}

export async function gatherResearchContext(
  prompt: string,
  session?: WorkshopSession | null,
): Promise<GatheredResearchContext> {
  const ideaTitle = deriveAtomLabel({
    title: session?.ideaBrief?.title,
    oneLiner: session?.ideaBrief?.oneLiner,
    rawIntent: prompt,
    fallback: session?.catalogTitle,
  });

  const [graphInspect, catalogMatches, github] = await Promise.all([
    buildGraphInspect({
      rawIntent: prompt,
      ideaTitle,
      canonicalId: session?.catalogCanonicalId,
    }),
    Promise.resolve(rankCatalogIdeas(loadNormalizedIdeas(), prompt, ideaTitle, 8)),
    searchGithubIdeasRepo(prompt, ideaTitle),
  ]);

  const testnet = graphInspect.networks.find((n) => n.network === "testnet");
  const overlapRisk = overlapRiskLevel(
    catalogMatches,
    testnet?.similarAtoms.length ?? 0,
    testnet?.coreTriple.exists ?? false,
  );

  const parts: string[] = [];
  if (catalogMatches[0]) parts.push(`Close catalog match: « ${catalogMatches[0].title} ».`);
  if ((testnet?.similarAtoms.length ?? 0) > 0) {
    parts.push(`${testnet!.similarAtoms.length} similar atom(s) on the graph.`);
  }
  if (testnet?.coreTriple.exists) parts.push("A similar core triple already exists.");
  if (github.issues.length > 0) parts.push(`${github.issues.length} GitHub discussion(s).`);
  const overlapMessage = parts.length ? parts.join(" ") : "Relatively open territory.";

  const graphContext = buildWorkshopGraphContext({
    graphInspect,
    catalogMatches,
    githubIssues: github.issues,
    overlap: { level: overlapRisk, message: overlapMessage },
  });

  return {
    ideaTitle,
    catalogMatches,
    githubIssues: github.issues,
    graphContext,
    overlapMessage,
  };
}
