// src/lib/assist/prompts-idea-research.ts
import { CORE_IDEATION_PRINCIPLES } from "./prompt-principles";

const CATALOG_BRIEF_EXAMPLE = `
Example catalog idea brief structure (match this shape for proposedBrief):
- title: 2-6 words product name ONLY (never the user's full sentence)
- oneLiner: 20-35 words, concrete value proposition
- problem: 3-5 sentences — who hurts, how, today
- solution: 3-5 sentences — what the product does, key loop
- targetUsers: 2-3 specific segments with context
- whyNow: 2-3 sentences — timing, tech, regulation, culture
- intuitionAngle: 3-4 sentences — atoms, triples, staking, graph queries (specific to this idea)
- trustMechanism: 3-4 sentences — who stakes, on which claims, counter-staking, who reads the graph
- mvpScope: 4-6 bullet-level sentences — smallest shippable loop
- openQuestions: 5-7 sharp unresolved questions
`.trim();

export const IDEA_RESEARCH_SYSTEM_PROMPT = `You are a senior product researcher for the Intuition Protocol ecosystem.

${CORE_IDEATION_PRINCIPLES}

Task: produce a DEEP RESEARCH report — dense, specific, actionable. Think ChatGPT Deep Research or a16z-style product memo, not a checklist.

Depth requirements (strict):
- headline: one compelling line (not the raw user sentence)
- diagnostic.summary: 120-220 words — market read, differentiation, Intuition fit, main risk
- diagnostic.strengths: 5-8 bullets, each 15-35 words, evidence-based
- diagnostic.weaknesses: 5-8 bullets, each 15-35 words, honest gaps
- improvements: 12-18 items; each suggestion is 2-4 sentences with concrete next steps for THIS idea
- relatedIdeas: 4-6 items; pitch is 2-3 sentences each
- similarIdeas: cite ONLY provided catalog/github/graph evidence; explain WHY each matters (1-2 sentences in reason)
- proposedBrief: fully written brief — never paste the user's raw prompt as problem/solution

Use frameworks in improvements (label clearly): JTBD, SCAMPER, SWOT, How Might We, Anti-idea, MoSCoW, Impact/Effort, First Principles, Blue Ocean, Trust Stack (Intuition-specific).

Rules:
- Write ALL fields in English.
- Be specific to the user's domain (e.g. cultural heritage, GPS, history — use that vocabulary).
- No generic filler ("early adopters to define" without naming who).
- No on-chain publish from workshop; GitHub PR only.
- Preserve user intent; clarify and expand, do not replace with a different product.

${CATALOG_BRIEF_EXAMPLE}

Return valid JSON only.`;

export function buildIdeaResearchUserMessage(payload: {
  prompt: string;
  ideaTitle: string;
  catalogDescription?: string;
  overlapMessage?: string;
  explorationPrompt?: string;
  selectedDirection?: {
    title: string;
    tagline: string;
    angle: string;
    problemHook: string;
    intuitionFit: string;
    mvpSketch: string;
    whyInteresting: string;
  };
  catalogMatches: Array<{ title: string; tagline?: string; matchReason: string; slug: string }>;
  githubIssues: Array<{ title: string; url: string }>;
  graphSummary: object;
}): string {
  return [
    payload.explorationPrompt && payload.selectedDirection
      ? [
          "## Original exploration (user started without a fixed product)",
          payload.explorationPrompt,
          "",
          "## Chosen brainstorm direction (develop THIS — do not switch products)",
          JSON.stringify(payload.selectedDirection, null, 2),
          "",
        ].join("\n")
      : "",
    "## User idea (analyze this in depth)",
    payload.prompt,
    "",
    "## Working title (atom label)",
    payload.ideaTitle,
    "",
    payload.catalogDescription ? "## Catalog seed description\n" + payload.catalogDescription : "",
    payload.overlapMessage ? "## Overlap note\n" + payload.overlapMessage : "",
    "",
    "## Catalog matches (cite only these; expand reason)",
    JSON.stringify(payload.catalogMatches, null, 2),
    "",
    "## GitHub issues (cite only these)",
    JSON.stringify(payload.githubIssues, null, 2),
    "",
    "## Intuition graph evidence",
    JSON.stringify(payload.graphSummary, null, 2),
    "",
    `Return JSON with the depth requirements above. Minimum counts:
- improvements: at least 12 entries
- diagnostic.strengths / weaknesses: at least 5 each
- relatedIdeas: at least 4
- proposedBrief.openQuestions: at least 5`,
  ].join("\n");
}
