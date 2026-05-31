// src/lib/assist/generate-brainstorm.ts
import { z } from "zod";
import { BRAINSTORM_SYSTEM_PROMPT, buildBrainstormUserMessage } from "./prompts";
import { getAssistModel, getOpenAIClient, isAssistEnabled } from "./openai";
import type { GraphInspectResult } from "@/lib/intuition/graph-inspect";
import { graphInspectForPrompt } from "@/lib/intuition/graph-inspect";

export const brainstormCoachSchema = z.object({
  reflection: z.string(),
  clearerNow: z.array(z.string()).min(1).max(6),
  stillVague: z.array(z.string()).min(1).max(6),
  questions: z.array(z.string()).min(2).max(4),
  cardGuidance: z.string(),
  graphInsights: z.array(z.string()).max(6),
  risks: z.array(z.string()).max(4),
});

export type BrainstormCoach = z.infer<typeof brainstormCoachSchema>;

export interface BrainstormCoachInput {
  rawIntent: string;
  refinementSummary: string;
  catalogTitle?: string;
  catalogDescription?: string;
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

  const path = input.picks.map((p) => p.title).join(" → ");

  return {
    reflection:
      "Affine l'angle produit et le mécanisme de confiance avant de figer la fiche. Tu clarifies l'idée — tu ne la remplaces pas.",
    clearerNow: path
      ? [`Modèle choisi : ${path}`]
      : ["L'intention brute est enregistrée — le modèle produit reste à préciser."],
    stillVague: [
      "Qui est le premier utilisateur actif ou payant ?",
      "Quelle claim précise mériterait un stake sur Intuition ?",
    ],
    questions: [
      "Qui a besoin de cette information avant de décider ?",
      "Quelle claim serait coûteuse ou difficile à falsifier ?",
      "Qui aurait assez de crédibilité pour staker en premier ?",
    ],
    cardGuidance:
      "Choisis la carte qui précise le modèle d'acteurs : utilisateur, contributeur, vérificateur, attaquant potentiel.",
    graphInsights: insights.length
      ? insights
      : ["Configure OPENAI_API_KEY pour une analyse graphe enrichie."],
    risks: [
      "Risque de rester une app Web2 si le mécanisme de stake sur des claims n'est pas explicite.",
      "Doublon d'atom si le label est trop proche d'une idée migrée.",
    ],
  };
}
