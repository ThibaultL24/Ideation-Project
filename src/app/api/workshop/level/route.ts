// src/app/api/workshop/level/route.ts
import { NextResponse } from "next/server";
import {
  getLevelAfterPicks,
  isRefinementComplete,
  MAX_CARD_DEPTH,
  type CardPick,
} from "@/lib/workshop/card-tree";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { picks?: CardPick[] };
    const picks = body.picks ?? [];

    if (isRefinementComplete(picks)) {
      return NextResponse.json({
        complete: true,
        depth: picks.length,
        maxDepth: MAX_CARD_DEPTH,
        level: null,
      });
    }

    const level = getLevelAfterPicks(picks);
    if (!level) {
      return NextResponse.json(
        { error: "Invalid pick path", complete: true },
        { status: 400 },
      );
    }

    return NextResponse.json({
      complete: false,
      depth: picks.length,
      maxDepth: MAX_CARD_DEPTH,
      level,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
