// src/app/api/assist/triples/route.ts
import { NextResponse } from "next/server";
import { generateTripleDraft } from "@/lib/assist/generate-triples";
import { isAssistEnabled } from "@/lib/assist/openai";
import { buildGraphInspect } from "@/lib/intuition/graph-inspect";
import type { WorkshopSession } from "@/lib/workshop/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { session?: WorkshopSession };

    const session = body.session;
    if (!session?.rawIntent?.trim()) {
      return NextResponse.json({ error: "session required" }, { status: 400 });
    }

    const rawIntent = session.rawIntent.trim();
    const ideaTitle =
      session.ideaBrief?.title?.trim() ||
      session.catalogTitle?.trim() ||
      rawIntent.slice(0, 80);
    const picks = session.picks.map((p) => ({ title: p.title }));
    const refinementSummary = session.refinementSummary?.trim() ?? rawIntent;

    const graphInspect = await buildGraphInspect({
      rawIntent,
      ideaTitle,
      canonicalId: session.catalogCanonicalId,
    });

    const { draft, source } = await generateTripleDraft({
      rawIntent,
      refinementSummary,
      picks,
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
