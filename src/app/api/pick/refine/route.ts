// src/app/api/pick/refine/route.ts
import { NextResponse } from "next/server";
import {
  refinePick,
  type PickRefineRequest,
} from "@/lib/ideas/pick-refinement";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PickRefineRequest;
    if (!body.intent || typeof body.intent !== "string") {
      return NextResponse.json(
        { error: "intent is required" },
        { status: 400 },
      );
    }
    const result = await refinePick({
      intent: body.intent,
      answers: body.answers ?? [],
      excludeSlugs: body.excludeSlugs,
      focusSlug: body.focusSlug,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
