// src/app/api/brainstorm/challenge/route.ts
import { NextResponse } from "next/server";
import { generateIdeationChallenge } from "@/lib/assist/generate-ideation-challenge";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    intent?: string;
    headline?: string;
    appDescription?: string;
    intuitionFit?: string;
    mvp?: string;
    risks?: string[];
    overlapMessage?: string;
  };

  const intent = body.intent?.trim() ?? "";
  const appDescription = body.appDescription?.trim() ?? "";
  if (intent.length < 10 || appDescription.length < 20) {
    return NextResponse.json(
      { error: "intent and appDescription are required" },
      { status: 400 },
    );
  }

  try {
    const { challenge, source, assistError, modelUsed } =
      await generateIdeationChallenge({
        intent,
        headline: body.headline?.trim() || intent.slice(0, 60),
        appDescription,
        intuitionFit: body.intuitionFit?.trim() ?? "",
        mvp: body.mvp?.trim() ?? "",
        risks: body.risks ?? [],
        overlapMessage: body.overlapMessage,
      });

    return NextResponse.json({ challenge, source, assistError, modelUsed });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Challenge failed" },
      { status: 500 },
    );
  }
}
