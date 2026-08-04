// src/app/api/brainstorm/elaborate/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateIdeationElaborate } from "@/lib/assist/generate-ideation-elaborate";
import { ideationActionIdSchema } from "@/lib/ideas/ideation-actions";
import { normalizeBrainstormDraft } from "@/lib/ideas/publish-plan";
import type { Idea } from "@/lib/ideas/schema";

const ideaPayloadSchema = z.object({
  canonicalId: z.string(),
  slug: z.string(),
  title: z.string(),
  tagline: z.string().default(""),
  category: z.string().default("General"),
  categoryIndex: z.number().int().default(1),
  ideaIndex: z.number().int().default(1),
  description: z.string().default(""),
  comparable: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.string().default("draft"),
});

const bodySchema = z.object({
  action: ideationActionIdSchema,
  intent: z.string().max(4000).optional(),
  idea: ideaPayloadSchema,
  draft: z.record(z.unknown()).optional(),
  ideaVersion: z.number().int().nonnegative().default(1),
  previousResults: z.array(z.unknown()).optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid elaborate payload", issues: parsed.error.issues.slice(0, 5) },
      { status: 400 },
    );
  }

  const idea = parsed.data.idea as unknown as Idea;
  const draft = normalizeBrainstormDraft(
    (parsed.data.draft ?? {}) as Partial<ReturnType<typeof normalizeBrainstormDraft>>,
  );

  try {
    const { result, source, modelUsed, assistError } = await generateIdeationElaborate({
      action: parsed.data.action,
      idea,
      draft,
      ideaVersion: parsed.data.ideaVersion,
      intent: parsed.data.intent,
    });

    // Never publish from generation — results are intermediate only.
    return NextResponse.json({
      result,
      source,
      modelUsed: modelUsed ?? null,
      assistError: assistError ?? null,
      published: false,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Elaborate failed",
        published: false,
      },
      { status: 500 },
    );
  }
}
