// src/app/api/workshop/prepare/onchain/route.ts
import { NextResponse } from "next/server";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import { resolveNetwork, type IntuitionNetwork } from "@/lib/intuition/config";
import { publishWorkshopOnchain } from "@/lib/intuition/publish-workshop";
import { resolveIdeaFromSession } from "@/lib/workshop/resolve-idea";
import type { WorkshopSession } from "@/lib/workshop/session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    session?: WorkshopSession;
    network?: IntuitionNetwork;
    githubBlobUrl?: string;
  };

  const session = body.session;
  if (!session?.rawIntent?.trim()) {
    return NextResponse.json({ error: "session required" }, { status: 400 });
  }

  const draft = session.tripleDraft as EnrichedTripleDraft | undefined;
  if (!draft?.coreTriple) {
    return NextResponse.json(
      { error: "Génère et valide les triples au brainstorm avant de publier." },
      { status: 400 },
    );
  }

  const idea = resolveIdeaFromSession(session);
  const network = body.network ?? resolveNetwork();

  try {
    const result = await publishWorkshopOnchain({
      idea,
      draft,
      network,
      githubBlobUrl: body.githubBlobUrl,
    });

    const nothingCreated =
      result.skipped.includes("subject-atom") &&
      result.skipped.includes("core-triple");

    return NextResponse.json({
      mode: nothingCreated ? "already_onchain" : "published",
      result,
      explorerBase:
        network === "mainnet"
          ? "https://explorer.intuition.systems"
          : "https://testnet.explorer.intuition.systems",
      portalUrl: "https://testnet.portal.intuition.systems/explore/home",
    });
  } catch (error) {
    return NextResponse.json(
      {
        mode: "not_published",
        error: error instanceof Error ? error.message : String(error),
        hint: "Vérifie INTUITION_PRIVATE_KEY et le solde tTRUST sur testnet.",
      },
      { status: 502 },
    );
  }
}
