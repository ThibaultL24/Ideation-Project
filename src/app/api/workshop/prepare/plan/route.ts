// src/app/api/workshop/prepare/plan/route.ts
import { NextResponse } from "next/server";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import { buildWorkshopPublishPlan } from "@/lib/workshop/publish-plan";
import { resolveIdeaFromSession } from "@/lib/workshop/resolve-idea";
import type { WorkshopSession } from "@/lib/workshop/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { session?: WorkshopSession };
    const session = body.session;
    if (!session?.rawIntent?.trim()) {
      return NextResponse.json({ error: "session required" }, { status: 400 });
    }

    const idea = resolveIdeaFromSession(session);
    const draft = session.tripleDraft as EnrichedTripleDraft | undefined;
    const plan = buildWorkshopPublishPlan(idea, draft, session);

    return NextResponse.json({ idea: { slug: idea.slug, title: idea.title, canonicalId: idea.canonicalId }, plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
