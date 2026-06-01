// src/app/api/workshop/discover/route.ts
import { NextResponse } from "next/server";
import { loadNormalizedIdeas } from "@/lib/ideas/load";
import { buildGraphInspect } from "@/lib/intuition/graph-inspect";
import {
  overlapRiskLevel,
  rankCatalogIdeas,
  type CatalogMatch,
} from "@/lib/workshop/discover-similar";
import { searchGithubIdeasRepo } from "@/lib/workshop/github-discover";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      rawIntent?: string;
      ideaTitle?: string;
      canonicalId?: string;
    };

    const rawIntent = body.rawIntent?.trim() ?? "";
    const ideaTitle = body.ideaTitle?.trim() || rawIntent.slice(0, 80) || "New Idea";

    if (rawIntent.length < 10) {
      return NextResponse.json({ error: "Intent too short" }, { status: 400 });
    }

    const [graphInspect, catalogMatches, github] = await Promise.all([
      buildGraphInspect({ rawIntent, ideaTitle, canonicalId: body.canonicalId }),
      Promise.resolve(
        rankCatalogIdeas(loadNormalizedIdeas(), rawIntent, ideaTitle, 8),
      ),
      searchGithubIdeasRepo(rawIntent, ideaTitle),
    ]);

    const testnet = graphInspect.networks.find((n) => n.network === "testnet");
    const similarAtomCount = testnet?.similarAtoms.length ?? 0;
    const coreTripleExists = testnet?.coreTriple.exists ?? false;

    const overlapRisk = overlapRiskLevel(
      catalogMatches,
      similarAtomCount,
      coreTripleExists,
    );

    const overlapMessage = buildOverlapMessage(
      overlapRisk,
      catalogMatches,
      similarAtomCount,
      coreTripleExists,
      github.issues.length,
    );

    return NextResponse.json({
      graphInspect,
      catalogMatches,
      githubIssues: github.issues,
      githubSearchError: github.error,
      overlap: { level: overlapRisk, message: overlapMessage },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildOverlapMessage(
  level: "low" | "medium" | "high",
  catalog: CatalogMatch[],
  similarAtoms: number,
  coreExists: boolean,
  githubCount: number,
): string {
  const parts: string[] = [];
  if (catalog[0]) {
    parts.push(`Close catalog match: « ${catalog[0].title} » (${catalog[0].matchReason}).`);
  }
  if (similarAtoms > 0) {
    parts.push(`${similarAtoms} similar atom(s) on the Intuition graph.`);
  }
  if (coreExists) {
    parts.push("A core triple already exists for a similar subject.");
  }
  if (githubCount > 0) {
    parts.push(`${githubCount} discussion(s) found in intuition-box/ideas.`);
  }
  if (parts.length === 0) {
    return "Few duplicates detected — relatively open territory.";
  }
  if (level === "high") {
    return `${parts.join(" ")} Sharpen your angle or consider a pivot before going further.`;
  }
  if (level === "medium") {
    return `${parts.join(" ")} Clarify how your idea differs.`;
  }
  return parts.join(" ");
}
