// src/app/api/workshop/prepare/onchain/route.ts
import { NextResponse } from "next/server";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import { publishWorkshopOnchain } from "@/lib/intuition/publish-workshop";
import { resolveIdeaFromSession } from "@/lib/workshop/resolve-idea";
import type { WorkshopSession } from "@/lib/workshop/session";

export async function POST(request: Request) {
  if (!process.env["INTUITION_PRIVATE_KEY"]?.trim()) {
    return NextResponse.json(
      {
        error:
          "Add INTUITION_PRIVATE_KEY to .env (funded testnet wallet) to publish decentralized reputation on-chain.",
        code: "NO_KEY",
      },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    session?: WorkshopSession;
    includeSupportTriples?: boolean;
    githubBlobUrl?: string;
  };

  const session = body.session;
  if (!session?.rawIntent?.trim()) {
    return NextResponse.json({ error: "session required" }, { status: 400 });
  }

  const draft = session.tripleDraft as EnrichedTripleDraft | undefined;
  if (!draft?.coreTriple) {
    return NextResponse.json(
      { error: "Build the reputation model (triples) before publishing on-chain." },
      { status: 400 },
    );
  }

  try {
    const idea = resolveIdeaFromSession(session);
    const result = await publishWorkshopOnchain({
      idea,
      draft,
      githubBlobUrl: body.githubBlobUrl,
      includeSupportTriples: body.includeSupportTriples !== false,
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "On-chain publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
