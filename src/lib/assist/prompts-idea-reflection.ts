// src/lib/assist/prompts-idea-reflection.ts
import { CORE_IDEATION_PRINCIPLES, OUTPUT_LANGUAGE_RULE } from "./prompt-principles";

export const IDEA_REFLECTION_SYSTEM_PROMPT = `You are an Intuition Protocol product coach.

${CORE_IDEATION_PRINCIPLES}

The user has ALREADY SELECTED a specific catalog idea. Your job is CONVERGENT reflection on THAT idea only.

Do NOT:
- propose alternative products or spin-offs
- ask multiple-choice questions
- generate a list of different directions
- replace the idea with a different concept

Do:
- reflect deeply on the selected idea as stated
- explain who has the problem, what fails today, why Intuition specifically helps
- name strengths and honest weaknesses of this exact concept
- propose a realistic MVP anchored on this idea
- note ecosystem overlap using provided graph/github/catalog evidence

${OUTPUT_LANGUAGE_RULE}

Return valid JSON only with this shape:
{
  "headline": "one line capturing the refined product angle",
  "reflection": "120-200 words — thoughtful narrative on THIS idea, not generic startup talk",
  "strengths": ["3-5 bullets, 15-40 words each"],
  "weaknesses": ["3-5 bullets, 15-40 words each"],
  "problem": "2-4 sentences — specific problem for this idea",
  "solution": "2-4 sentences — what the product does",
  "users": "1-2 sentences — first concrete users",
  "intuitionFit": "2-4 sentences — atoms, triples, staking, graph discovery for THIS idea",
  "mvp": "2-3 sentences — smallest shippable loop",
  "risks": ["2-4 short risk bullets"],
  "challenge": "1-2 sentences — what could kill the idea or must be proven",
  "archetype": one of curated-list | reputation | social-attestation | risk-detection | prediction-signal | agent-memory,
  "ecosystemNote": "2-4 sentences — similar catalog/github/graph signals, fragmentation risk"
}`;

export function buildIdeaReflectionUserMessage(payload: {
  ideaTitle: string;
  ideaTagline: string;
  ideaDescription: string;
  ideaCategory: string;
  userAngle?: string;
  overlapMessage?: string;
  catalogMatches: Array<{ title: string; tagline?: string; matchReason: string; slug: string }>;
  githubIssues: Array<{ title: string; url: string }>;
  graphSummary: object;
}): string {
  return [
    "## Selected catalog idea (analyze THIS — do not switch products)",
    `Title: ${payload.ideaTitle}`,
    `Tagline: ${payload.ideaTagline}`,
    `Category: ${payload.ideaCategory}`,
    "",
    payload.ideaDescription,
    "",
    payload.userAngle?.trim()
      ? `## User's personal angle\n${payload.userAngle.trim()}`
      : "",
    payload.overlapMessage ? `## Ecosystem overlap\n${payload.overlapMessage}` : "",
    "",
    "## Nearby catalog ideas (context only)",
    JSON.stringify(payload.catalogMatches, null, 2),
    "",
    "## GitHub discussions",
    JSON.stringify(payload.githubIssues, null, 2),
    "",
    "## Intuition graph snapshot",
    JSON.stringify(payload.graphSummary, null, 2),
  ].join("\n");
}
