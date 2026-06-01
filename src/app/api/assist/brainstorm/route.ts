// src/app/api/assist/brainstorm/route.ts
import { NextResponse } from "next/server";
import { generateBrainstorm } from "@/lib/assist/generate-brainstorm";
import { isAssistEnabled } from "@/lib/assist/openai";
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
      body.prompt?.trim() || session?.explorationPrompt?.trim() || session?.rawIntent?.trim() || "";

    if (explorationPrompt.length < 10) {
      return NextResponse.json(
        { error: "Describe what you want to explore in at least 10 characters." },
        { status: 400 },
      );
    }

    const ctx = await gatherResearchContext(explorationPrompt, session);

    const { report, source, assistError, modelUsed } = await generateBrainstorm({
      explorationPrompt,
      prompt: explorationPrompt,
      ideaTitle: ctx.ideaTitle,
      catalogDescription: session?.catalogDescription,
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
      graphContext: ctx.graphContext,
      assistEnabled: isAssistEnabled(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
