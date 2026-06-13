// src/app/api/publish/onchain/route.ts
import { NextResponse } from "next/server";
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import { resolveIdeaInput } from "@/lib/ideas/resolve-idea-input";
import { publishIdeaOnchain } from "@/lib/intuition/publish-idea";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    slug?: string;
    idea?: unknown;
    draft?: Partial<BrainstormDraft>;
    githubBlobUrl?: string;
    dryRun?: boolean;
  };

  const idea = resolveIdeaInput(body.slug, body.idea);
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  try {
    const result = await publishIdeaOnchain({
      idea,
      draft: body.draft,
      githubBlobUrl: body.githubBlobUrl,
      dryRun: body.dryRun,
    });

    if (body.dryRun) {
      return NextResponse.json({ mode: "dry_run", result });
    }

    if (result.mode === "already_complete") {
      return NextResponse.json({
        mode: "already_complete",
        message: "Idea atom and core triple already exist on-chain.",
        result,
      });
    }

    return NextResponse.json({ mode: "published", result });
  } catch (error) {
    return NextResponse.json(
      {
        mode: "not_published",
        error: error instanceof Error ? error.message : String(error),
        hint:
          "Requires INTUITION_PRIVATE_KEY (server wallet), INTUITION_NETWORK, and enough tTRUST/TRUST. Use GET /api/publish/onchain/preview?slug=… to inspect costs first.",
      },
      { status: 502 },
    );
  }
}
