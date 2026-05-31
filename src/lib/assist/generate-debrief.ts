// src/lib/assist/generate-debrief.ts
import { z } from "zod";
import {
  DEBRIEF_ANALYSIS_SYSTEM_PROMPT,
  DEBRIEF_QUESTIONS_SYSTEM_PROMPT,
  buildDebriefAnalysisUserMessage,
  buildDebriefQuestionsUserMessage,
} from "./prompts-debrief";
import { getAssistModel, getOpenAIClient, isAssistEnabled } from "./openai";
import type { GraphInspectResult } from "@/lib/intuition/graph-inspect";
import { graphInspectForPrompt } from "@/lib/intuition/graph-inspect";
import {
  normalizeIdeaDebrief,
  type DebriefAnswer,
  type IdeaDebrief,
} from "@/lib/workshop/idea-debrief";

const debriefQuestionsSchema = z.object({
  questions: z.array(z.string()).min(3).max(5),
});

const debriefAnalysisSchema = z.object({
  headline: z.string(),
  analysis: z.string(),
  strengths: z.array(z.string()).min(2).max(6),
  weaknesses: z.array(z.string()).min(2).max(6),
  improvements: z.array(z.string()).min(2).max(6),
  alternatives: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        whenToChoose: z.string(),
      }),
    )
    .min(1)
    .max(4),
  intuitionFit: z.string(),
  recommendation: z.enum(["pursue", "pivot", "pause"]),
});

export interface DebriefInput {
  rawIntent: string;
  refinementSummary: string;
  picks: Array<{ title: string }>;
  ideaTitle: string;
  catalogDescription?: string;
  coachQuestions?: string[];
  graphInspect?: GraphInspectResult;
}

export async function generateDebriefQuestions(
  input: DebriefInput,
): Promise<{ questions: string[]; source: "openai" | "fallback" }> {
  if (input.coachQuestions?.length) {
    return { questions: input.coachQuestions.slice(0, 5), source: "fallback" };
  }

  const client = getOpenAIClient();
  if (!isAssistEnabled() || !client) {
    return { questions: fallbackQuestions(input), source: "fallback" };
  }

  try {
    const completion = await client.chat.completions.create({
      model: getAssistModel(),
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: DEBRIEF_QUESTIONS_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildDebriefQuestionsUserMessage({
            rawIntent: input.rawIntent,
            refinementSummary: input.refinementSummary,
            picks: input.picks,
            catalogTitle: input.ideaTitle,
            coachQuestions: input.coachQuestions,
          }),
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("empty");
    const parsed = debriefQuestionsSchema.parse(JSON.parse(raw));
    return { questions: parsed.questions, source: "openai" };
  } catch {
    return { questions: fallbackQuestions(input), source: "fallback" };
  }
}

export async function generateIdeaDebrief(
  input: DebriefInput & { answers: DebriefAnswer[] },
): Promise<{ debrief: IdeaDebrief; source: "openai" | "fallback" }> {
  const client = getOpenAIClient();
  const graphContext = input.graphInspect
    ? graphInspectForPrompt(input.graphInspect)
    : undefined;

  if (!isAssistEnabled() || !client) {
    return {
      debrief: fallbackDebrief(input, input.answers),
      source: "fallback",
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: getAssistModel(),
      temperature: 0.45,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: DEBRIEF_ANALYSIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildDebriefAnalysisUserMessage({
            rawIntent: input.rawIntent,
            refinementSummary: input.refinementSummary,
            picks: input.picks,
            catalogTitle: input.ideaTitle,
            catalogDescription: input.catalogDescription,
            answers: input.answers,
            graphContext,
          }),
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("empty");
    const parsed = debriefAnalysisSchema.parse(JSON.parse(raw));
    return { debrief: normalizeIdeaDebrief(parsed), source: "openai" };
  } catch {
    return {
      debrief: fallbackDebrief(input, input.answers),
      source: "fallback",
    };
  }
}

function fallbackQuestions(input: DebriefInput): string[] {
  return [
    "Qui est le premier utilisateur concret — nomme un profil, pas « tout le monde » ?",
    "Quelle décision importante cette app aide-t-elle à prendre ?",
    "Quelle claim précise serait stakée sur Intuition — et par qui en premier ?",
    "Pourquoi quelqu'un utiliserait ceci plutôt qu'une solution Web2 existante ?",
    "Quel est le plus gros risque si personne ne stake les 30 premiers jours ?",
  ];
}

function fallbackDebrief(
  input: DebriefInput,
  answers: DebriefAnswer[],
): IdeaDebrief {
  const path = input.picks.map((p) => p.title).join(" → ");
  const answered = answers.filter((a) => a.answer.trim()).length;

  return normalizeIdeaDebrief({
    headline:
      answered > 0
        ? "L'idée a un angle produit, mais le mécanisme de confiance reste à verrouiller."
        : "Réponds aux questions pour un débrief plus précis.",
    analysis: [
      input.refinementSummary || input.rawIntent,
      path ? `Parcours cartes : ${path}.` : "",
      answered > 0
        ? `Tu as répondu à ${answered} question(s) — affine le mécanisme de stake avant publication.`
        : "Configure OPENAI_API_KEY pour une analyse plus riche.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    strengths: [
      "Intention produit déjà formulée.",
      path ? `Modèle clarifié via : ${path}.` : "Parcours cartes à compléter.",
    ],
    weaknesses: [
      "Le cold start (premiers stakers) n'est peut-être pas résolu.",
      "Risque de ressembler à une app Web2 sans claims économiques claires.",
    ],
    improvements: [
      "Nommer une claim testable que des humains stakeraient en semaine 1.",
      "Réduire le MVP à un seul cas d'usage décisionnel.",
      "Vérifier les atoms similaires sur testnet avant de créer un doublon.",
    ],
    alternatives: [
      {
        title: "Outil interne B2B",
        description: "Cibler une équipe qui a déjà un budget et des données.",
        whenToChoose: "Si les utilisateurs finaux ne stakent jamais.",
      },
      {
        title: "Curateur expert + signal faible",
        description: "Un petit nombre d'experts stakent, le public lit seulement.",
        whenToChoose: "Si la masse ne peut pas évaluer la qualité directement.",
      },
    ],
    intuitionFit:
      "Intuition aide si des claims réutilisables et un signal économique sont au cœur du produit — sinon un graphe classique suffit.",
    recommendation: answered >= 3 ? "pursue" : "pause",
  });
}
