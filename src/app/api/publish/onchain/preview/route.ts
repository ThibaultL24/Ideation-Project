// src/app/api/publish/onchain/preview/route.ts
import { NextResponse } from "next/server";
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import { loadNormalizedIdeas } from "@/lib/ideas/load";
import { resolveIdeaInput } from "@/lib/ideas/resolve-idea-input";
import { previewOnchainPublish } from "@/lib/intuition/publish-preview";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug query param is required" }, { status: 400 });
  }

  const idea = loadNormalizedIdeas().find((item) => item.slug === slug);
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  try {
    const preview = await previewOnchainPublish({ idea });
    return NextResponse.json({ preview });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    slug?: string;
    idea?: unknown;
    draft?: Partial<BrainstormDraft>;
    githubBlobUrl?: string;
  };

  const idea = resolveIdeaInput(body.slug, body.idea);
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  try {
    const preview = await previewOnchainPublish({
      idea,
      draft: body.draft,
      githubBlobUrl: body.githubBlobUrl,
    });
    return NextResponse.json({ preview });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
