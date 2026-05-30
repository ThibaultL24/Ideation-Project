// src/app/api/intuition/inspect/route.ts
import { NextResponse } from "next/server";
import { buildGraphInspect } from "@/lib/intuition/graph-inspect";
import type { IntuitionNetwork } from "@/lib/intuition/config";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      rawIntent?: string;
      ideaTitle?: string;
      canonicalId?: string;
      networks?: IntuitionNetwork[];
    };

    const rawIntent = body.rawIntent?.trim() ?? "";
    const ideaTitle = body.ideaTitle?.trim() || rawIntent.slice(0, 80);
    if (!ideaTitle) {
      return NextResponse.json({ error: "ideaTitle or rawIntent required" }, { status: 400 });
    }

    const result = await buildGraphInspect({
      rawIntent,
      ideaTitle,
      canonicalId: body.canonicalId,
      networks: body.networks ?? ["testnet", "mainnet"],
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
