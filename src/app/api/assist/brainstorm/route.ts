// src/app/api/assist/brainstorm/route.ts
import { NextResponse } from "next/server";
import { generateBrainstormCoach } from "@/lib/assist/generate-brainstorm";
import { isAssistEnabled } from "@/lib/assist/openai";
import { buildGraphInspect } from "@/lib/intuition/graph-inspect";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      rawIntent?: string;
      refinementSummary?: string;
      ideaTitle?: string;
      catalogTitle?: string;
      catalogDescription?: string;
      canonicalId?: string;
      picks?: Array<{ title: string; levelId: string }>;
      currentLevelQuestion?: string;
    };

    const rawIntent = body.rawIntent?.trim() ?? "";
    const ideaTitle = body.ideaTitle?.trim() || rawIntent.slice(0, 80);
    const picks = body.picks ?? [];

    const graphInspect = await buildGraphInspect({
      rawIntent,
      ideaTitle,
      canonicalId: body.canonicalId,
    });

    const { coach, source } = await generateBrainstormCoach({
      rawIntent,
      refinementSummary: body.refinementSummary?.trim() ?? rawIntent,
      catalogTitle: body.catalogTitle?.trim() || ideaTitle,
      catalogDescription: body.catalogDescription,
      picks,
      currentLevelQuestion: body.currentLevelQuestion,
      graphInspect,
    });

    return NextResponse.json({
      coach,
      source,
      assistEnabled: isAssistEnabled(),
      graphInspect,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
