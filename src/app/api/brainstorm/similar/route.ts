// src/app/api/brainstorm/similar/route.ts
import { NextResponse } from "next/server";
import { searchSimilarCatalog } from "@/lib/ideas/similar-catalog";

export async function POST(request: Request) {
  const body = (await request.json()) as { intent?: string };
  const intent = body.intent?.trim() ?? "";
  if (intent.length < 10) {
    return NextResponse.json(
      { error: "Décrivez votre idée en au moins 10 caractères." },
      { status: 400 },
    );
  }

  try {
    const result = await searchSimilarCatalog(intent);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 },
    );
  }
}
