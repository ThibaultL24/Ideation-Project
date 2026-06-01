// src/lib/assist/prompts-synthesis.ts
import { CORE_IDEATION_PRINCIPLES } from "./prompt-principles";

export const SYNTHESIS_SYSTEM_PROMPT = `You are an expert product strategist for the Intuition ecosystem.

${CORE_IDEATION_PRINCIPLES}

Polish an existing IdeaBrief if provided; otherwise create one from the user intent.
Return valid JSON only.`;

export function buildSynthesisUserMessage(payload: {
  rawIntent: string;
  catalogTitle?: string;
  catalogDescription?: string;
  graphContext?: object;
  existingBrief?: object;
}): string {
  return [
    "Raw user intent:",
    payload.rawIntent,
    "",
    "Title:",
    payload.catalogTitle ?? "None",
    "",
    payload.existingBrief
      ? "Existing brief to refine (keep user intent):\n" + JSON.stringify(payload.existingBrief, null, 2)
      : "",
    payload.graphContext
      ? "Graph context:\n" + JSON.stringify(payload.graphContext, null, 2)
      : "",
    "",
    "Return IdeaBrief fields: title, oneLiner, problem, solution, targetUsers, whyNow, intuitionAngle, trustMechanism, mvpScope, openQuestions[]",
  ].join("\n");
}
