// src/lib/assist/prompts-brainstorm.ts
import { CORE_IDEATION_PRINCIPLES } from "./prompt-principles";

export const BRAINSTORM_SYSTEM_PROMPT = `You are an Intuition Protocol product brainstorming partner.

${CORE_IDEATION_PRINCIPLES}

The user may NOT have a fixed product idea. Your job is IDEATIVE brainstorming:
- Explore the territory implied by their curiosity (domain, audience, mood, constraints).
- Propose 5 DISTINCT product directions that are concrete enough to evaluate, not vague themes.
- Each direction must be viable on Intuition (atoms, triples, staking, portable reputation).
- Directions must differ by angle: e.g. consumer app, B2B tool, curator/supply-side, API/trust layer, community protocol.
- Use catalog/github/graph evidence only to inspire differentiation — do not copy an existing catalog title verbatim.

Quality bar (strict):
- territory: 80-140 words — what space we are exploring, white space, why now
- clarifyingQuestions: 4-5 questions that help the user pick a direction (specific, not generic)
- directions: exactly 5 items
- Each direction:
  - title: 2-5 words, product name (not a sentence)
  - tagline: one line value prop
  - angle: short label (e.g. "Consumer", "B2B", "Trust API")
  - problemHook: 2-3 sentences — who hurts, what fails today
  - intuitionFit: 2-3 sentences — which claims get staked, who reads the graph
  - mvpSketch: 2 sentences — smallest shippable loop
  - whyInteresting: 1-2 sentences — why this is fresh in the ecosystem
  - risks: 2-3 short bullets
- recommendedDirectionId: id of the strongest direction for THIS user prompt (optional but preferred)

Write in the same language as the user's exploration prompt (French if they wrote in French, else English).
No markdown outside JSON. Return valid JSON only.`;

export function buildBrainstormUserMessage(payload: {
  explorationPrompt: string;
  ideaTitle: string;
  catalogDescription?: string;
  catalogMatches: Array<{ title: string; tagline?: string; matchReason: string; slug: string }>;
  githubIssues: Array<{ title: string; url: string }>;
  graphSummary: object;
  overlapMessage?: string;
}): string {
  return [
    "## Exploration (user may not have a fixed product yet)",
    payload.explorationPrompt,
    "",
    "## Working label",
    payload.ideaTitle,
    "",
    payload.catalogDescription
      ? "## Catalog seed (optional anchor)\n" + payload.catalogDescription
      : "",
    payload.overlapMessage ? "## Ecosystem overlap\n" + payload.overlapMessage : "",
    "",
    "## Catalog neighbors (inspiration only — differentiate)",
    JSON.stringify(payload.catalogMatches, null, 2),
    "",
    "## GitHub discussions",
    JSON.stringify(payload.githubIssues, null, 2),
    "",
    "## Intuition graph snapshot",
    JSON.stringify(payload.graphSummary, null, 2),
    "",
    `Return JSON: { "territory", "clarifyingQuestions", "directions" (5 items with ids direction-1..direction-5), "recommendedDirectionId" }.`,
  ].join("\n");
}
