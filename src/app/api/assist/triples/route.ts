// src/app/api/assist/triples/route.ts
import { NextResponse } from "next/server";
import { generateTripleDraft } from "@/lib/assist/generate-triples";
import { isAssistEnabled } from "@/lib/assist/openai";
import { buildGraphInspect } from "@/lib/intuition/graph-inspect";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      rawIntent?: string;
      refinementSummary?: string;
      picks?: Array<{ title: string }>;
      ideaTitle?: string;
      catalogDescription?: string;
      canonicalId?: string;
    };

    const rawIntent = body.rawIntent?.trim() ?? "";
    const ideaTitle = body.ideaTitle?.trim() || rawIntent.slice(0, 80) || "New Idea";
    const picks = body.picks ?? [];
    const refinementSummary = body.refinementSummary?.trim() ?? rawIntent;

    const graphInspect = await buildGraphInspect({
      rawIntent,
      ideaTitle,
      canonicalId: body.canonicalId,
    });

    const { draft, source } = await generateTripleDraft({
      rawIntent,
      refinementSummary,
      picks,
      ideaTitle,
      catalogDescription: body.catalogDescription,
      graphInspect,
    });

    return NextResponse.json({
      draft,
      source,
      assistEnabled: isAssistEnabled(),
      graphInspect,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
