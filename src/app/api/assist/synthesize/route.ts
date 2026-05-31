// src/app/api/assist/synthesize/route.ts
import { NextResponse } from "next/server";
import { generateIdeaBrief } from "@/lib/assist/generate-synthesis";
import { isAssistEnabled } from "@/lib/assist/openai";
import type { IdeaDebrief } from "@/lib/workshop/idea-debrief";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      rawIntent?: string;
      refinementSummary?: string;
      picks?: Array<{ title: string }>;
      ideaTitle?: string;
      catalogDescription?: string;
      debriefAnswers?: Array<{ question: string; answer: string }>;
      ideaDebrief?: object;
    };

    const rawIntent = body.rawIntent?.trim() ?? "";
    const ideaTitle = body.ideaTitle?.trim() || rawIntent.slice(0, 80) || "New Idea";
    const picks = body.picks ?? [];

    const { brief, source } = await generateIdeaBrief({
      rawIntent,
      refinementSummary: body.refinementSummary?.trim() ?? rawIntent,
      picks,
      ideaTitle,
      catalogDescription: body.catalogDescription,
      debriefAnswers: body.debriefAnswers,
      ideaDebrief: body.ideaDebrief as IdeaDebrief | undefined,
    });

    return NextResponse.json({
      brief,
      source,
      assistEnabled: isAssistEnabled(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
