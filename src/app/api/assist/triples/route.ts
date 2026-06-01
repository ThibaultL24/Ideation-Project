// src/app/api/assist/triples/route.ts
import { NextResponse } from "next/server";
import { generateTripleDraft } from "@/lib/assist/generate-triples";
import { isAssistEnabled } from "@/lib/assist/openai";
import { resolveGraphInspectForAssist } from "@/lib/workshop/resolve-graph-context";
import { resolveWorkshopAtomLabel } from "@/lib/workshop/atom-label";
import type { WorkshopSession } from "@/lib/workshop/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { session?: WorkshopSession };

    const session = body.session;
    if (!session?.rawIntent?.trim()) {
      return NextResponse.json({ error: "session required" }, { status: 400 });
    }

    const rawIntent = session.rawIntent.trim();
    const ideaTitle = resolveWorkshopAtomLabel({
      rawIntent,
      catalogTitle: session.catalogTitle,
      ideaBrief: session.ideaBrief,
    });
    const refinementSummary =
      session.ideaBrief?.oneLiner?.trim() ||
      session.ideaBrief?.problem?.trim()?.slice(0, 300) ||
      rawIntent;

    const graphInspect = await resolveGraphInspectForAssist({
      rawIntent,
      ideaTitle,
      canonicalId: session.catalogCanonicalId,
      graphContext: session.graphContext,
    });

    const { draft, source } = await generateTripleDraft({
      rawIntent,
      refinementSummary,
      ideaTitle,
      catalogDescription: session.catalogDescription,
      ideaBrief: session.ideaBrief,
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
