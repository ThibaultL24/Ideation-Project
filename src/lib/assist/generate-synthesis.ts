// src/lib/assist/generate-synthesis.ts
import { assistSynthesisResponseSchema } from "./schemas";
import { SYNTHESIS_SYSTEM_PROMPT, buildSynthesisUserMessage } from "./prompts-synthesis";
import { getAssistModel, getOpenAIClient, isAssistEnabled } from "./openai";
import { normalizeIdeaBrief, type IdeaBrief } from "@/lib/workshop/idea-brief";

export interface GenerateSynthesisInput {
  rawIntent: string;
  refinementSummary: string;
  picks: Array<{ title: string }>;
  ideaTitle: string;
  catalogDescription?: string;
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
        "Intuition pourrait porter des attestations ou du signal sur cette idée — détail au moment de publier.",
      mvpScope: "3 écrans ou un workflow minimal pour tester l'hypothèse.",
      openQuestions: "Valider le positionnement avant d'écrire des triples.",
    },
    input.ideaTitle,
  );
}
