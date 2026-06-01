// src/lib/assist/generate-synthesis.ts
import { assistSynthesisResponseSchema } from "./schemas";
import { SYNTHESIS_SYSTEM_PROMPT, buildSynthesisUserMessage } from "./prompts-synthesis";
import { getAssistModel, getOpenAIClient, isAssistEnabled } from "./openai";
import type { WorkshopGraphContext } from "@/lib/workshop/graph-context-types";
import { graphContextForPrompt } from "@/lib/workshop/graph-context-types";
import { normalizeIdeaBrief, type IdeaBrief } from "@/lib/workshop/idea-brief";

export interface GenerateSynthesisInput {
  rawIntent: string;
  ideaTitle: string;
  catalogDescription?: string;
  graphContext?: WorkshopGraphContext;
  existingBrief?: Partial<IdeaBrief>;
}

export async function generateIdeaBrief(
  input: GenerateSynthesisInput,
): Promise<{ brief: IdeaBrief; source: "openai" | "fallback" }> {
  const client = getOpenAIClient();
  if (!isAssistEnabled() || !client) {
    return {
      brief: normalizeIdeaBrief(
        input.existingBrief ?? fallbackFields(input),
        input.ideaTitle,
        input.rawIntent,
      ),
      source: "fallback",
    };
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
            catalogTitle: input.ideaTitle,
            catalogDescription: input.catalogDescription,
            graphContext: input.graphContext
              ? graphContextForPrompt(input.graphContext)
              : undefined,
            existingBrief: input.existingBrief,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("empty");
    const parsed = assistSynthesisResponseSchema.parse(JSON.parse(raw));
    return {
      brief: normalizeIdeaBrief(
        { ...input.existingBrief, ...parsed } as Parameters<typeof normalizeIdeaBrief>[0],
        input.ideaTitle,
        input.rawIntent,
      ),
      source: "openai",
    };
  } catch {
    return {
      brief: normalizeIdeaBrief(
        input.existingBrief ?? fallbackFields(input),
        input.ideaTitle,
        input.rawIntent,
      ),
      source: "fallback",
    };
  }
}

function fallbackFields(input: GenerateSynthesisInput): Partial<IdeaBrief> {
  return {
    title: input.ideaTitle,
    oneLiner: input.rawIntent.slice(0, 160),
    problem: input.rawIntent,
    solution: input.existingBrief?.solution ?? input.rawIntent,
    targetUsers: "Early adopters to define",
    intuitionAngle:
      "Structure attestable claims on the Intuition graph rather than an isolated Web2 app.",
    trustMechanism: "Who stakes, on which claims, who queries the graph.",
    mvpScope: "Smallest testable loop in 2–4 weeks.",
    openQuestions: [
      "Who is the first active user?",
      "What unique claim justifies Intuition?",
    ],
  };
}
