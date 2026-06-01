// src/app/api/assist/synthesize/route.ts
import { NextResponse } from "next/server";
import { generateIdeaBrief } from "@/lib/assist/generate-synthesis";
import { isAssistEnabled } from "@/lib/assist/openai";
import type { IdeaBrief } from "@/lib/workshop/idea-brief";
import type { WorkshopGraphContext } from "@/lib/workshop/graph-context-types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      rawIntent?: string;
      ideaTitle?: string;
      catalogDescription?: string;
      graphContext?: WorkshopGraphContext;
      existingBrief?: Partial<IdeaBrief>;
    };

    const rawIntent = body.rawIntent?.trim() ?? "";
    const ideaTitle = body.ideaTitle?.trim() || rawIntent.slice(0, 80) || "New Idea";

    const { brief, source } = await generateIdeaBrief({
      rawIntent,
      ideaTitle,
      catalogDescription: body.catalogDescription,
      graphContext: body.graphContext,
      existingBrief: body.existingBrief,
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
