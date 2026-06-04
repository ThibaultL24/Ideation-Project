// src/app/api/brainstorm/similar/route.ts
import { NextResponse } from "next/server";
import { findSimilarIdeas } from "@/lib/ideas/brainstorm-similarity";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      category?: string;
    };
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
