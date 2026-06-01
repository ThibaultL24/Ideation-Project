// src/lib/assist/prompts.ts
import { CORE_IDEATION_PRINCIPLES } from "./prompt-principles";
import { TRIPLE_PROTOCOL_CONTEXT } from "./intuition-protocol-context";
import type { EcosystemTripleExample } from "./fetch-triple-examples";

export const TRIPLE_SYSTEM_PROMPT = `You are an Intuition semantic modeling assistant for the Ideation workshop.

You have read the Intuition protocol rules below. Follow them strictly.

${TRIPLE_PROTOCOL_CONTEXT}

${CORE_IDEATION_PRINCIPLES}

Your task: produce a triple draft for a GitHub PR README (documentation only — no transactions).

Before writing support triples, study ecosystemTripleExamples and graphContext.existingSubjectTriples.
Mirror real predicate/object patterns from the graph — do not invent generic marketing claims.

Return valid JSON only matching outputSchema in the user message.`;

export function buildTripleUserMessage(payload: {
  rawIntent: string;
  refinementSummary: string;
  catalogTitle?: string;
  catalogDescription?: string;
  ideaBrief?: object;
  graphContext: object;
  ecosystemTripleExamples?: EcosystemTripleExample[];
}): string {
  return JSON.stringify(
    {
      userIntent: payload.rawIntent,
      refinementSummary: payload.refinementSummary,
      catalogIdea: payload.catalogTitle
        ? {
            title: payload.catalogTitle,
            description: payload.catalogDescription?.slice(0, 800),
          }
        : null,
      ideaBrief: payload.ideaBrief ?? null,
      graphContext: payload.graphContext,
      ecosystemTripleExamples: payload.ecosystemTripleExamples ?? [],
      outputSchema: {
        ideaTitle: "string — MUST equal ideaBrief.title (2-6 words, atom label)",
        refinedPitch: "string — from ideaBrief.oneLiner",
        archetypeSummary: "string — short angle from ideaBrief.intuitionAngle",
        coreTriple:
          "{ subject: SAME as ideaTitle (short name), predicate: top project ideas for, object: Intuition Protocol ONLY on core }",
        supportTriples:
          "max 4 — subject = ideaTitle; NEVER use bounty predicate on support; objects = short noun phrases (max 6 words); never paste user paragraph",
        nestedTriples: "max 2, usually []",
        protocolNotes: "max 6 — duplicates, core exists, predicate reuse",
      },
    },
    null,
    2,
  );
}
