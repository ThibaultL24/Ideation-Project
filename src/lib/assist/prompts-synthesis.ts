// src/lib/assist/prompts-synthesis.ts
import { CORE_IDEATION_PRINCIPLES } from "./prompt-principles";

export const SYNTHESIS_SYSTEM_PROMPT = `You are an expert product strategist for the Intuition ecosystem.

${CORE_IDEATION_PRINCIPLES}

Your task: produce an IdeaBrief as an AI PROPOSAL the user will correct field by field before publication.

Intuition context (explain structurally, not hype):
- Atoms represent identities (users, products, concepts, problems, ideas).
- Triples are claims [Subject] [Predicate] [Object].
- Vaults express economic conviction; counter-staking enables disagreement.
- The graph makes claims queryable and composable across apps.

Writing rules:
- Be specific. Avoid generic Web3 or startup language.
- Preserve the user's intent and debrief answers when provided.
- Apply debrief improvements and strengths; carry open questions into openQuestions.
- If the idea is weak, improve it reasonably but keep honest openQuestions.
- intuitionAngle: why Intuition helps structurally (3-5 sentences) — NO final triples, NO term_id.
- trustMechanism: who stakes, on what claims, what becomes atoms, who queries the graph (3-5 sentences) — still NOT a triple draft.
- Do NOT mention publishing or transactions.
- Return valid JSON only.`;

export function buildSynthesisUserMessage(payload: {
  rawIntent: string;
  refinementSummary: string;
  picks: Array<{ title: string }>;
  catalogTitle?: string;
  catalogDescription?: string;
  debrief?: object;
  debriefAnswers?: Array<{ question: string; answer: string }>;
}): string {
  return [
    "Raw user intent:",
    payload.rawIntent,
    "",
    "Catalog idea title:",
    payload.catalogTitle ?? "None",
    "",
    "Catalog idea description:",
    payload.catalogDescription ?? "None",
    "",
    "Refinement summary:",
    payload.refinementSummary,
    "",
    "Selected refinement cards:",
    JSON.stringify(payload.picks, null, 2),
    "",
    payload.debriefAnswers?.length
      ? "User answers to debrief questions:\n" +
        JSON.stringify(payload.debriefAnswers, null, 2)
      : "",
    payload.debrief
      ? "Prior debrief analysis (incorporate improvements and keep strengths):\n" +
        JSON.stringify(payload.debrief, null, 2)
      : "",
    "",
    "Generate an IdeaBrief with fields: title, oneLiner, problem, solution, targetUsers, whyNow, intuitionAngle, trustMechanism, mvpScope, openQuestions",
    "",
    "Constraints:",
    "- title: max 8 words",
    "- oneLiner: max 25 words",
    "- problem: 2-4 sentences",
    "- solution: 2-4 sentences",
    "- targetUsers: concise, specific (not 'everyone')",
    "- whyNow: 1-3 sentences",
    "- intuitionAngle: 3-5 sentences, Intuition-native but no triple syntax",
    "- trustMechanism: 3-5 sentences — atoms represented, claims that matter, who stakes, who queries",
    "- mvpScope: must-have features only, concise",
    "- openQuestions: array of 3-5 unresolved questions",
  ].join("\n");
}
