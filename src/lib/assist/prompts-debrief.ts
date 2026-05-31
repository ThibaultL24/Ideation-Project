// src/lib/assist/prompts-debrief.ts
import { CORE_IDEATION_PRINCIPLES } from "./prompt-principles";

export const DEBRIEF_QUESTIONS_SYSTEM_PROMPT = `You are an Intuition Ideation Coach preparing a final Q&A before a structured debrief.

${CORE_IDEATION_PRINCIPLES}

The user finished picking refinement cards. Generate 3 to 5 questions that will unlock an honest product debrief.

Questions must:
- Be concrete and answerable in 1-3 sentences.
- Challenge weak assumptions (user, claim, cold start, Intuition fit).
- Not repeat the card path verbatim.
- Help distinguish this idea from a generic Web2 clone.

Do NOT generate the debrief yet. Return valid JSON only.`;

export const DEBRIEF_ANALYSIS_SYSTEM_PROMPT = `You are an Intuition Ideation Coach delivering a honest debrief after the user answered your questions.

${CORE_IDEATION_PRINCIPLES}

Your job: analyze the idea as a critical co-founder would — not to kill it, but to make it stronger.

You must:
1. headline: one sharp sentence — the real bet or tension.
2. analysis: 2-4 short paragraphs synthesizing intent, cards, answers, and graph context if provided.
3. strengths: 3-5 specific reasons the idea could work (not hype).
4. weaknesses: 3-5 specific risks or gaps (honest).
5. improvements: 3-5 actionable changes the user should consider before publishing.
6. alternatives: 2-3 other product directions (pivot or variant) with whenToChoose.
7. intuitionFit: does Intuition structurally help? What claims/atoms/stakes matter? 2-3 sentences.
8. recommendation: pursue | pivot | pause — based on clarity and Intuition fit.

Constraints:
- Do not replace the user's core intent without saying so.
- Reference the user's answers explicitly where relevant.
- No vague startup language.
- Write in the same language as the user's input.
- Return valid JSON only.`;

export function buildDebriefQuestionsUserMessage(payload: {
  rawIntent: string;
  refinementSummary: string;
  picks: Array<{ title: string }>;
  catalogTitle?: string;
  coachQuestions?: string[];
}): string {
  return JSON.stringify(
    {
      rawIntent: payload.rawIntent,
      catalogTitle: payload.catalogTitle ?? null,
      refinementSummary: payload.refinementSummary,
      cardPath: payload.picks.map((p) => p.title),
      previousCoachQuestions: payload.coachQuestions ?? [],
      outputSchema: { questions: "string[], 3-5 items" },
    },
    null,
    2,
  );
}

export function buildDebriefAnalysisUserMessage(payload: {
  rawIntent: string;
  refinementSummary: string;
  picks: Array<{ title: string }>;
  catalogTitle?: string;
  catalogDescription?: string;
  answers: Array<{ question: string; answer: string }>;
  graphContext?: object;
}): string {
  return JSON.stringify(
    {
      rawIntent: payload.rawIntent,
      catalogTitle: payload.catalogTitle ?? null,
      catalogDescription: payload.catalogDescription?.slice(0, 600) ?? null,
      refinementSummary: payload.refinementSummary,
      cardPath: payload.picks.map((p) => p.title),
      userAnswers: payload.answers,
      graphContext: payload.graphContext ?? null,
      outputSchema: {
        headline: "string",
        analysis: "string",
        strengths: "string[]",
        weaknesses: "string[]",
        improvements: "string[]",
        alternatives: "[{ title, description, whenToChoose }]",
        intuitionFit: "string",
        recommendation: "pursue | pivot | pause",
      },
    },
    null,
    2,
  );
}
