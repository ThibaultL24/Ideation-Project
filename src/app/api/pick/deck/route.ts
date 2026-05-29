// src/app/api/pick/deck/route.ts
import { NextResponse } from "next/server";
import { loadNormalizedIdeas } from "@/lib/ideas/load";
import { buildIdeaFullState, pickRandomIdeas } from "@/lib/ideas/idea-state";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = Math.min(
    8,
    Math.max(2, Number(searchParams.get("count") ?? "4") || 4),
  );

  const ideas = loadNormalizedIdeas();
  const deck = pickRandomIdeas(ideas, count);
  const cards = await Promise.all(
    deck.map((idea) => buildIdeaFullState(idea, { verifyOnchain: false })),
  );

  return NextResponse.json({ cards });
}
