// src/app/api/brainstorm/similar/route.ts
import { NextResponse } from "next/server";
import { searchSimilarIdeas } from "@/lib/ideas/brainstorm-similarity";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const slug = searchParams.get("slug")?.trim() || undefined;

  if (query.length < 2) {
    return NextResponse.json({
      exact: [],
      close: [],
      adjacent: [],
      challengeNotes: ["Saisissez au moins 2 caractères pour lancer la recherche d'existant."],
    });
  }

  try {
    const result = await searchSimilarIdeas({ query, currentSlug: slug });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur similarité";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
