// src/lib/assist/prompts-ideation-challenge.ts
import { CORE_IDEATION_PRINCIPLES } from "./prompt-principles";

export const IDEATION_CHALLENGE_SYSTEM_PROMPT = `You are an Intuition Protocol devil's advocate — constructive but honest.

${CORE_IDEATION_PRINCIPLES}

The user finished an ideation synthesis for THEIR product idea. Your job is the CHALLENGE step:
- Find the single strongest objection that could kill this idea (feasibility, market, cold start, or "why Intuition at all").
- Propose one counter-direction: a meaningful variation of the same idea that dodges the objection ("et si on inversait…").
- Surface 2-4 killer assumptions: things that MUST be true for the idea to work, ranked by risk.
- Ask 2-4 open questions the user should answer before building.
- End with a short, honest verdict: is the idea stronger or weaker after this stress test, and why.

Be specific to THIS idea — no generic startup advice. Reference the user's own words.
Write in the same language as the user's input (French if they wrote in French).

Return valid JSON:
{
  "mainObjection": "2-3 sentences — the strongest argument against the idea",
  "counterDirection": "2-3 sentences — a variation of the idea that answers the objection",
  "killerAssumptions": ["2-4 short bullets — what must be true, riskiest first"],
  "openQuestions": ["2-4 short questions to answer before building"],
  "verdict": "1-2 sentences — honest overall judgment, encouraging if deserved"
}`;

export function buildIdeationChallengeUserMessage(payload: {
  intent: string;
  headline: string;
  appDescription: string;
  intuitionFit: string;
  mvp: string;
  risks: string[];
  overlapMessage?: string;
}): string {
  return [
    "## The idea to challenge",
    `Headline: ${payload.headline}`,
    "",
    "## Original user intent",
    payload.intent,
    "",
    "## Current description",
    payload.appDescription,
    "",
    "## Claimed Intuition fit",
    payload.intuitionFit,
    "",
    "## Planned MVP",
    payload.mvp,
    "",
    "## Risks already identified (do not just repeat these)",
    payload.risks.map((r) => `- ${r}`).join("\n"),
    "",
    payload.overlapMessage ? `## Ecosystem overlap\n${payload.overlapMessage}` : "",
  ].join("\n");
}
