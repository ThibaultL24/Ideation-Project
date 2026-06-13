// src/app/api/brainstorm/reflect/route.ts
import { NextResponse } from "next/server";
import { generateIdeaReflection } from "@/lib/assist/generate-idea-reflection";
import { isAssistEnabled } from "@/lib/assist/openai";
import { loadNormalizedIdeas } from "@/lib/ideas/load";
import { normalizeIdeaBrief } from "@/lib/workshop/idea-brief";
import { gatherResearchContext } from "@/lib/workshop/gather-research-context";
import { defaultSession } from "@/lib/workshop/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { slug?: string; userAngle?: string };
    const idea = loadNormalizedIdeas().find((item) => item.slug === body.slug);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const seed = [idea.title, idea.tagline, idea.description, body.userAngle]
      .filter(Boolean)
      .join("\n\n");

    const ctx = await gatherResearchContext(
      seed,
      defaultSession({
        rawIntent: seed,
        catalogTitle: idea.title,
        catalogSlug: idea.slug,
        catalogCanonicalId: idea.canonicalId,
        catalogDescription: idea.description,
        ideaBrief: normalizeIdeaBrief(
          { title: idea.title, oneLiner: idea.tagline, problem: idea.description },
          idea.title,
          seed,
        ),
      }),
    );

    const { report, source, assistError, modelUsed } = await generateIdeaReflection({
      idea,
      userAngle: body.userAngle,
      graphContext: ctx.graphContext,
      catalogMatches: ctx.catalogMatches,
      githubIssues: ctx.githubIssues,
      overlapMessage: ctx.overlapMessage,
    });

    return NextResponse.json({
      report,
      source,
      assistError,
      modelUsed,
      assistEnabled: isAssistEnabled(),
      overlapMessage: ctx.overlapMessage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
