// src/lib/assist/generate-synthesis.ts
import { assistSynthesisResponseSchema } from "./schemas";
import { SYNTHESIS_SYSTEM_PROMPT, buildSynthesisUserMessage } from "./prompts-synthesis";
import { getAssistModel, getOpenAIClient, isAssistEnabled } from "./openai";
import type { DebriefAnswer, IdeaDebrief } from "@/lib/workshop/idea-debrief";
import { normalizeIdeaBrief, type IdeaBrief } from "@/lib/workshop/idea-brief";

export interface GenerateSynthesisInput {
  rawIntent: string;
  refinementSummary: string;
  picks: Array<{ title: string }>;
  ideaTitle: string;
  catalogDescription?: string;
  debriefAnswers?: DebriefAnswer[];
  ideaDebrief?: IdeaDebrief;
}

export async function generateIdeaBrief(
  input: GenerateSynthesisInput,
): Promise<{ brief: IdeaBrief; source: "openai" | "fallback" }> {
  const client = getOpenAIClient();
  if (!isAssistEnabled() || !client) {
    return { brief: fallbackBrief(input), source: "fallback" };
  }

  try {
    const completion = await client.chat.completions.create({
      model: getAssistModel(),
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYNTHESIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildSynthesisUserMessage({
            rawIntent: input.rawIntent,
            refinementSummary: input.refinementSummary,
            picks: input.picks,
            catalogTitle: input.ideaTitle,
            catalogDescription: input.catalogDescription,
            debriefAnswers: input.debriefAnswers,
            debrief: input.ideaDebrief,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("empty");
    const parsed = assistSynthesisResponseSchema.parse(JSON.parse(raw));
    return {
      brief: normalizeIdeaBrief(parsed, input.ideaTitle),
      source: "openai",
    };
  } catch {
    return { brief: fallbackBrief(input), source: "fallback" };
  }
}

function fallbackBrief(input: GenerateSynthesisInput): IdeaBrief {
  return normalizeIdeaBrief(
    {
      title: input.ideaTitle,
      oneLiner: input.refinementSummary.slice(0, 160) || input.rawIntent.slice(0, 160),
      problem: "À préciser : qui souffre du problème aujourd'hui ?",
      solution: input.rawIntent,
      targetUsers: "Early adopters à définir",
      whyNow: "Moment opportun lié au parcours cartes : " + input.picks.map((p) => p.title).join(" → "),
      intuitionAngle:
        "Intuition peut structurer des identités (atoms) et des claims économiquement soutenus plutôt qu'une simple liste d'avis.",
      trustMechanism:
        "À définir : quelles entités deviennent des atoms, quelles claims comptent, qui stake et qui interroge le graphe.",
      mvpScope: "3 écrans ou un workflow minimal pour tester l'hypothèse.",
      openQuestions: [
        "Quel est le premier cas d'usage payant ou très fréquent ?",
        "Quelle claim unique justifie Intuition vs une app Web2 ?",
        "Qui stake en premier et pourquoi ?",
      ],
    },
    input.ideaTitle,
  );
}
