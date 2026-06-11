// src/app/api/brainstorm/assist/route.ts
import { NextResponse } from "next/server";
import { generateBrainstorm } from "@/lib/assist/generate-brainstorm";
import { isAssistEnabled } from "@/lib/assist/openai";
import { loadNormalizedIdeas } from "@/lib/ideas/load";
import { normalizeIdeaBrief } from "@/lib/workshop/idea-brief";
import { gatherResearchContext } from "@/lib/workshop/gather-research-context";
import { defaultSession } from "@/lib/workshop/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { slug?: string; prompt?: string };
    const idea = loadNormalizedIdeas().find((item) => item.slug === body.slug);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const explorationPrompt =
      body.prompt?.trim() ||
      [idea.title, idea.tagline, idea.description].filter(Boolean).join("\n\n");

    if (explorationPrompt.length < 10) {
      return NextResponse.json(
        { error: "Not enough context to brainstorm this idea." },
        { status: 400 },
      );
    }

    const ctx = await gatherResearchContext(
      explorationPrompt,
      defaultSession({
        rawIntent: explorationPrompt,
        catalogTitle: idea.title,
        catalogCanonicalId: idea.canonicalId,
        catalogDescription: idea.description,
        ideaBrief: normalizeIdeaBrief(
          { title: idea.title, oneLiner: idea.tagline, problem: idea.description },
          idea.title,
          explorationPrompt,
        ),
      }),
    );

    const { report, source, assistError, modelUsed } = await generateBrainstorm({
      explorationPrompt,
      prompt: explorationPrompt,
      ideaTitle: ctx.ideaTitle || idea.title,
      catalogDescription: idea.description,
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
