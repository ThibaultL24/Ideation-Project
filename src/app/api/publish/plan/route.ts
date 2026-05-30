import { NextResponse } from "next/server";
import { loadNormalizedIdeas } from "@/lib/ideas/load";
import { buildPublishPlan, type BrainstormDraft } from "@/lib/ideas/publish-plan";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    slug?: string;
    draft?: Partial<BrainstormDraft>;
  };

  const idea = loadNormalizedIdeas().find((item) => item.slug === body.slug);
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
