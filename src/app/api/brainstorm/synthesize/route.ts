// src/app/api/brainstorm/synthesize/route.ts
import { NextResponse } from "next/server";
import { generateIdeationSynthesis } from "@/lib/assist/generate-ideation-synthesize";
import type { IdeationAnswer } from "@/lib/ideas/ideation-session";
import { loadNormalizedIdeas } from "@/lib/ideas/load";
import { normalizeIdeaBrief } from "@/lib/workshop/idea-brief";
import { gatherResearchContext } from "@/lib/workshop/gather-research-context";
import { defaultSession } from "@/lib/workshop/session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    intent?: string;
    source?: "catalog" | "free";
    catalogSlug?: string;
    answers?: IdeationAnswer[];
  };

  const intent = body.intent?.trim() ?? "";
  if (intent.length < 10) {
    return NextResponse.json({ error: "Intent too short" }, { status: 400 });
  }

  const source = body.source ?? "free";
  const answers = body.answers ?? [];

  let catalogSeed: { title: string; tagline: string; description: string } | undefined;
  if (source === "catalog" && body.catalogSlug) {
    const idea = loadNormalizedIdeas().find((i) => i.slug === body.catalogSlug);
    if (idea) {
      catalogSeed = {
        title: idea.title,
        tagline: idea.tagline,
        description: idea.description,
      };
    }
  }

  const seed = [intent, catalogSeed?.title, catalogSeed?.description]
    .filter(Boolean)
    .join("\n\n");

  let overlapMessage: string | undefined;
  try {
    const ctx = await gatherResearchContext(
      seed,
      defaultSession({
        rawIntent: intent,
        catalogTitle: catalogSeed?.title,
        catalogSlug: body.catalogSlug,
        catalogDescription: catalogSeed?.description,
        ideaBrief: normalizeIdeaBrief(
          { title: catalogSeed?.title, oneLiner: intent, problem: intent },
          catalogSeed?.title ?? intent.slice(0, 40),
          intent,
        ),
      }),
    );
    overlapMessage = ctx.overlapMessage;
  } catch {
    overlapMessage = undefined;
  }

  try {
    const { synthesis, source: aiSource, assistError, modelUsed } =
      await generateIdeationSynthesis({
        intent,
        source,
        answers,
        catalogSeed,
        overlapMessage,
      });

    return NextResponse.json({
      synthesis,
      source: aiSource,
      assistError,
      modelUsed,
      overlapMessage,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Synthesis failed" },
      { status: 500 },
    );
  }
}
