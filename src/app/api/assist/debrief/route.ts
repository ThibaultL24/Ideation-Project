// src/app/api/assist/debrief/route.ts
import { NextResponse } from "next/server";
import {
  generateDebriefQuestions,
  generateIdeaDebrief,
} from "@/lib/assist/generate-debrief";
import { isAssistEnabled } from "@/lib/assist/openai";
import { buildGraphInspect } from "@/lib/intuition/graph-inspect";
import type { DebriefAnswer } from "@/lib/workshop/idea-debrief";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mode?: "questions" | "analyze";
      rawIntent?: string;
      refinementSummary?: string;
      picks?: Array<{ title: string }>;
      ideaTitle?: string;
      catalogDescription?: string;
      canonicalId?: string;
      coachQuestions?: string[];
      answers?: DebriefAnswer[];
    };

    const rawIntent = body.rawIntent?.trim() ?? "";
    const ideaTitle = body.ideaTitle?.trim() || rawIntent.slice(0, 80) || "New Idea";
    const picks = body.picks ?? [];
    const refinementSummary = body.refinementSummary?.trim() ?? rawIntent;

    const baseInput = {
      rawIntent,
      refinementSummary,
      picks,
      ideaTitle,
      catalogDescription: body.catalogDescription,
      coachQuestions: body.coachQuestions,
    };

    if (body.mode === "questions" || !body.answers?.length) {
      const { questions, source } = await generateDebriefQuestions(baseInput);
      return NextResponse.json({
        questions,
        source,
        assistEnabled: isAssistEnabled(),
      });
    }

    const graphInspect = await buildGraphInspect({
      rawIntent,
      ideaTitle,
      canonicalId: body.canonicalId,
    });

    const { debrief, source } = await generateIdeaDebrief({
      ...baseInput,
      answers: body.answers,
      graphInspect,
    });

    return NextResponse.json({
      debrief,
      source,
      assistEnabled: isAssistEnabled(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
