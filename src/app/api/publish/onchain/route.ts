// src/app/api/publish/onchain/route.ts
import { NextResponse } from "next/server";
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import { resolvePublishIdea } from "@/lib/ideas/resolve-publish-idea";
import { publishIdeaWithWriteConfig } from "@/lib/intuition/publish-execute";

/**
 * Preview / dry-run only. Real publishes are signed in the browser with the
 * user's wallet (see BrainstormPublishSection + publishIdeaWithWriteConfig).
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    slug?: string;
    idea?: unknown;
    draft?: Partial<BrainstormDraft>;
    githubBlobUrl?: string;
    dryRun?: boolean;
    prompt?: string;
    category?: string;
  };

  const idea = resolvePublishIdea(body);
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  if (!body.dryRun) {
    return NextResponse.json(
      {
        mode: "user_wallet_required",
        error:
          "On-chain publish must be signed by your connected wallet in the browser.",
        hint: "Connect a wallet on the On-chain tab, switch to Intuition, then publish. The server no longer broadcasts with INTUITION_PRIVATE_KEY.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await publishIdeaWithWriteConfig({
      idea,
      draft: body.draft,
      githubBlobUrl: body.githubBlobUrl,
      dryRun: true,
    });

    return NextResponse.json({ mode: "dry_run", result });
  } catch (error) {
    return NextResponse.json(
      {
        mode: "not_published",
        error: error instanceof Error ? error.message : String(error),
        hint: "Use POST /api/publish/onchain/preview to inspect costs, then publish from the connected wallet.",
      },
      { status: 502 },
    );
  }
}
