// src/app/api/publish/plan/route.ts
import { NextResponse } from "next/server";
import { resolveIdeaInput } from "@/lib/ideas/resolve-idea-input";
import { buildPublishPlan, type BrainstormDraft } from "@/lib/ideas/publish-plan";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    slug?: string;
    idea?: unknown;
    draft?: Partial<BrainstormDraft>;
  };

  const idea = resolveIdeaInput(body.slug, body.idea);
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  return NextResponse.json({
    idea: {
      slug: idea.slug,
      title: idea.title,
      canonicalId: idea.canonicalId,
    },
    plan: buildPublishPlan(idea, body.draft),
  });
}
