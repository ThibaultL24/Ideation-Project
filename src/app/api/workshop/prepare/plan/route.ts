// src/app/api/workshop/prepare/plan/route.ts
import { NextResponse } from "next/server";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import { buildWorkshopPublishPlan } from "@/lib/workshop/publish-plan";
import { resolveIdeaFromSession } from "@/lib/workshop/resolve-idea";
import type { WorkshopSession } from "@/lib/workshop/session";
import { normalizeSessionForPublish } from "@/lib/workshop/workshop-path";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { session?: WorkshopSession };
    const session = body.session;
    if (!session?.rawIntent?.trim()) {
      return NextResponse.json({ error: "session required" }, { status: 400 });
    }

    const normalized = normalizeSessionForPublish(session);
    const idea = resolveIdeaFromSession(normalized);
    const draft = normalized.tripleDraft as EnrichedTripleDraft | undefined;
    const plan = buildWorkshopPublishPlan(idea, draft, normalized);

    return NextResponse.json({ idea: { slug: idea.slug, title: idea.title, canonicalId: idea.canonicalId }, plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
