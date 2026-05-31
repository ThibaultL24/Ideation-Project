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

export const BRAINSTORM_SYSTEM_PROMPT = `You are an Intuition Ideation Coach.

${CORE_IDEATION_PRINCIPLES}

Context — Intuition is a trust protocol:
- Atoms: identities for entities, people, products, concepts, or ideas.
- Triples: claims [Subject] [Predicate] [Object].
- Vaults: economic conviction; counter-staking makes disagreement costly.
- Knowledge graph: queryable trust signals across apps.

Current step: REFINEMENT (card picking). The user chooses cards that define product model, trust mechanism, and Intuition fit — before any product brief or final triples.

Your job:
1. Reflect briefly on the current direction (do not replace the user's idea).
2. clearerNow: what became clearer from intent + card picks + graph data.
3. stillVague: what remains undefined.
4. questions: 2-4 concrete questions to unblock the next card or thinking.
5. cardGuidance: short advice for the current card choice.
6. graphInsights: facts from graphContext only (similar atoms, existing core triple, popular predicates).
7. risks: weak assumptions or protocol pitfalls (duplicate atoms, vague predicates, Web2-only product).

Constraints:
- Do NOT generate a full product brief.
- Do NOT generate final triples.
- Do NOT discuss publishing unless picks are complete.
- Do NOT overhype or use vague startup language.
- Keep the response short enough for a sidebar.
- Cite only labels/facts present in graphContext.

Return valid JSON only.`;

export function buildTripleUserMessage(payload: {
  rawIntent: string;
  refinementSummary: string;
  catalogTitle?: string;
  catalogDescription?: string;
  picks: Array<{ title: string }>;
  ideaBrief?: object;
  graphContext: object;
  ecosystemTripleExamples?: EcosystemTripleExample[];
}): string {
  return JSON.stringify(
    {
      userIntent: payload.rawIntent,
      refinementPath: payload.picks.map((p) => p.title),
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
        ideaTitle: "string — MUST match ideaBrief.title",
        refinedPitch: "string — from ideaBrief.oneLiner or synthesis",
        archetypeSummary: "string — card path summary",
        coreTriple:
          "{ subject: idea title, predicate: top project ideas for, object: Intuition Protocol, rationale, kind: core, recommended: true }",
        supportTriples:
          "max 4 — copy predicate style from ecosystemTripleExamples; objects = short noun phrases",
        nestedTriples: "max 2, usually []",
        protocolNotes: "max 6 — duplicates, core exists, predicate reuse",
      },
    },
    null,
    2,
  );
}

export function buildBrainstormUserMessage(payload: {
  rawIntent: string;
  refinementSummary: string;
  catalogTitle?: string;
  catalogDescription?: string;
  picks: Array<{ title: string; levelId: string }>;
  currentLevelQuestion?: string;
  graphContext: object;
}): string {
  return JSON.stringify(
    {
      rawIntent: payload.rawIntent,
      catalogTitle: payload.catalogTitle ?? null,
      catalogDescription: payload.catalogDescription?.slice(0, 600) ?? null,
      refinementSummary: payload.refinementSummary,
      picks: payload.picks,
      currentLevelQuestion: payload.currentLevelQuestion ?? null,
      graphInspect: {
        similarAtoms: "see graphContext.networks[].similarAtoms",
        existingCoreTriple: "see graphContext.networks[].coreTriple",
        popularPredicates: "see graphContext.networks[].popularPredicates",
        relatedTriples: "see graphContext.networks[].subjectTriples",
      },
      graphContext: payload.graphContext,
      outputSchema: {
        reflection: "string",
        clearerNow: "string[]",
        stillVague: "string[]",
        questions: "string[], 2-4 items",
        cardGuidance: "string",
        graphInsights: "string[]",
        risks: "string[]",
      },
    },
    null,
    2,
  );
}

export const CARDS_SYSTEM_PROMPT = `Tu génères exactement 4 cartes de brainstorming pour affiner une idée produit Intuition.
Chaque carte: id court (kebab-case), title (3-6 mots), subtitle (1 phrase), tags (2-4 mots).
Les 4 cartes doivent être distinctes, concrètes, et aller plus loin que le choix précédent.
Réponds en JSON uniquement.`;
