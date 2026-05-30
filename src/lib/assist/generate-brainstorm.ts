// src/lib/assist/generate-brainstorm.ts
import { z } from "zod";
import { BRAINSTORM_SYSTEM_PROMPT, buildBrainstormUserMessage } from "./prompts";
import { getAssistModel, getOpenAIClient, isAssistEnabled } from "./openai";
import type { GraphInspectResult } from "@/lib/intuition/graph-inspect";
import { graphInspectForPrompt } from "@/lib/intuition/graph-inspect";

export const brainstormCoachSchema = z.object({
  reflection: z.string(),
  questions: z.array(z.string()).min(2).max(4),
  graphInsights: z.array(z.string()).max(6),
  cardGuidance: z.string(),
  risks: z.array(z.string()).max(4),
});

export type BrainstormCoach = z.infer<typeof brainstormCoachSchema>;

export interface BrainstormCoachInput {
  rawIntent: string;
  refinementSummary: string;
  picks: Array<{ title: string; levelId: string }>;
  currentLevelQuestion?: string;
  graphInspect: GraphInspectResult;
}

export async function generateBrainstormCoach(
  input: BrainstormCoachInput,
): Promise<{ coach: BrainstormCoach; source: "openai" | "fallback" }> {
  const client = getOpenAIClient();
  if (!isAssistEnabled() || !client) {
    return { coach: fallbackCoach(input), source: "fallback" };
  }

  try {
    const completion = await client.chat.completions.create({
      model: getAssistModel(),
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: BRAINSTORM_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildBrainstormUserMessage({
            ...input,
            graphContext: graphInspectForPrompt(input.graphInspect),
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("empty");
    const coach = brainstormCoachSchema.parse(JSON.parse(raw));
    return { coach, source: "openai" };
  } catch {
    return { coach: fallbackCoach(input), source: "fallback" };
  }
}

function fallbackCoach(input: BrainstormCoachInput): BrainstormCoach {
  const testnet = input.graphInspect.networks.find((n) => n.network === "testnet");
  const insights: string[] = [];
  if (testnet?.coreTriple.exists) {
    insights.push("Cette idée a déjà un triple cœur onchain sur testnet.");
  }
  if (testnet?.similarAtoms.length) {
    insights.push(
      `${testnet.similarAtoms.length} atom(s) proche(s) trouvé(s) dans le graphe.`,
    );
  }

  return {
    reflection:
      "Affine ton angle produit avant de figer les triples. Chaque carte doit réduire l'ambiguïté sur qui est attesté et quel signal compte.",
    questions: [
      "Qui est le premier utilisateur payant ou actif ?",
      "Quelle claim précise serait stakée sur Intuition ?",
      "Quel prédicat du graphe existant pourrait être réutilisé ?",
    ],
    graphInsights: insights.length ? insights : ["Configure OPENAI_API_KEY pour une analyse graphe enrichie."],
    cardGuidance: "Choisis la carte qui précise le mécanisme de confiance, pas seulement le marché.",
    risks: ["Doublon d'atom si le label est trop proche d'une idée migrée."],
  };
}
