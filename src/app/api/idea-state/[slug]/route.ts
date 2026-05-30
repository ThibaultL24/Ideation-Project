// src/app/api/idea-state/[slug]/route.ts
import { NextResponse } from "next/server";
import { loadNormalizedIdeas } from "@/lib/ideas/load";
import { buildIdeaFullState, buildScopePrompt } from "@/lib/ideas/idea-state";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const verifyOnchain = searchParams.get("verifyOnchain") === "true";

  const idea = loadNormalizedIdeas().find((item) => item.slug === slug);
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  const state = await buildIdeaFullState(idea, { verifyOnchain });
  const prompt = buildScopePrompt(idea);

  return NextResponse.json({ idea, state, prompt });
}
