// src/app/api/brainstorm/similar/route.ts
import { NextResponse } from "next/server";
import { findSimilarIdeas } from "@/lib/ideas/brainstorm-similarity";
import { searchSimilarCatalog } from "@/lib/ideas/similar-catalog";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      intent?: string;
      prompt?: string;
      category?: string;
    };

    const intent = body.intent?.trim();
    if (intent) {
      if (intent.length < 10) {
        return NextResponse.json(
          { error: "Décrivez votre idée en au moins 10 caractères." },
          { status: 400 },
        );
      }
      const result = await searchSimilarCatalog(intent);
      return NextResponse.json(result);
    }

    const prompt = body.prompt?.trim();
    if (!prompt || prompt.length < 3) {
      return NextResponse.json(
        { error: "prompt must be at least 3 characters" },
        { status: 400 },
      );
    }

    const result = await findSimilarIdeas({
      prompt,
      category: body.category?.trim() || undefined,
      limit: 5,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
