import { NextResponse } from "next/server";
import { loadNormalizedIdeas } from "@/lib/ideas/load";
import { publishIdeaOnchain } from "@/lib/intuition/publish-idea";

export async function POST(request: Request) {
  const body = (await request.json()) as { slug?: string };
  const idea = loadNormalizedIdeas().find((item) => item.slug === body.slug);
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  try {
    const result = await publishIdeaOnchain({ idea });
    return NextResponse.json({ mode: "published", result });
  } catch (error) {
    return NextResponse.json(
      {
        mode: "not_published",
        error: error instanceof Error ? error.message : String(error),
        hint:
          "Onchain publishing from the dapp needs INTUITION_PRIVATE_KEY and enough TRUST/tTRUST on the server wallet.",
      },
      { status: 502 },
    );
  }
}
