// src/app/api/assist/idea-research/route.ts
import { NextResponse } from "next/server";
import { generateDeepResearch } from "@/lib/assist/generate-idea-research";
import { isAssistEnabled } from "@/lib/assist/openai";
import { directionToRefinedIntent } from "@/lib/workshop/brainstorm";
import { gatherResearchContext } from "@/lib/workshop/gather-research-context";
import type { WorkshopSession } from "@/lib/workshop/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      session?: WorkshopSession;
    };

    const session = body.session;
    const explorationPrompt =
      session?.explorationPrompt?.trim() || session?.rawIntent?.trim() || "";
    const selected = session?.selectedDirection;

    const prompt =
      body.prompt?.trim() ||
      (selected
        ? directionToRefinedIntent(explorationPrompt, selected)
        : explorationPrompt);

    if (prompt.length < 10) {
      return NextResponse.json(
        { error: "Describe your idea in at least 10 characters." },
        { status: 400 },
      );
    }

    const ctx = await gatherResearchContext(prompt, session);

    const { report, source, assistError, modelUsed } = await generateDeepResearch({
      prompt,
      ideaTitle: selected?.title ?? ctx.ideaTitle,
      catalogDescription: session?.catalogDescription,
      graphContext: ctx.graphContext,
      catalogMatches: ctx.catalogMatches,
      githubIssues: ctx.githubIssues,
      overlapMessage: ctx.overlapMessage,
      selectedDirection: selected,
      explorationPrompt,
    });

    return NextResponse.json({
      report,
      source,
      assistError,
      modelUsed,
      graphContext: ctx.graphContext,
      assistEnabled: isAssistEnabled(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
