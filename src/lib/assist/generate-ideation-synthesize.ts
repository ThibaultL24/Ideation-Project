// src/lib/assist/generate-ideation-synthesize.ts
import { z } from "zod";
import type { IdeationAnswer } from "@/lib/ideas/ideation-session";
import { buildFallbackIdeationSynthesis } from "./fallback-ideation-synthesize";
import {
  IDEATION_SYNTHESIZE_SYSTEM_PROMPT,
  buildIdeationSynthesizeUserMessage,
} from "./prompts-ideation-synthesize";
import {
  formatAssistError,
  getAssistModelCandidates,
  getOpenAIClient,
  isAssistEnabled,
} from "./openai";

const synthesisSchema = z.object({
  headline: z.string().min(4),
  reflection: z.string().min(80),
  perspectives: z.array(z.string().min(10)).min(2).max(5),
  appDescription: z.string().min(40),
  intuitionFit: z.string().min(30),
  mvp: z.string().min(20),
  risks: z.array(z.string().min(8)).min(2).max(4),
});

export interface IdeationSynthesis {
  headline: string;
  reflection: string;
  perspectives: string[];
  appDescription: string;
  intuitionFit: string;
  mvp: string;
  risks: string[];
}

export interface GenerateIdeationSynthesizeInput {
  intent: string;
  source: "catalog" | "free";
  answers: IdeationAnswer[];
  catalogSeed?: { title: string; tagline: string; description: string };
  overlapMessage?: string;
}

export async function generateIdeationSynthesis(
  input: GenerateIdeationSynthesizeInput,
): Promise<{
  synthesis: IdeationSynthesis;
  source: "openai" | "fallback";
  assistError?: string;
  modelUsed?: string;
}> {
  const client = getOpenAIClient();
  if (!isAssistEnabled() || !client) {
    const fallback = buildFallbackIdeationSynthesis({
      intent: input.intent,
      answers: input.answers,
      catalogTitle: input.catalogSeed?.title,
    });
    return {
      synthesis: fallback,
      source: "fallback",
      assistError: "OPENAI_API_KEY missing or ASSIST_ENABLED=false",
    };
  }

  const userMessage = buildIdeationSynthesizeUserMessage({
    intent: input.intent,
    source: input.source,
    catalogSeed: input.catalogSeed,
    answers: input.answers,
    overlapMessage: input.overlapMessage,
  });

  let lastError: unknown;
  for (const model of getAssistModelCandidates()) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.65,
        max_tokens: 2500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: IDEATION_SYNTHESIZE_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty OpenAI response");

      const synthesis = synthesisSchema.parse(JSON.parse(raw));
      return { synthesis, source: "openai", modelUsed: model };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    synthesis: buildFallbackIdeationSynthesis({
      intent: input.intent,
      answers: input.answers,
      catalogTitle: input.catalogSeed?.title,
    }),
    source: "fallback",
    assistError: formatAssistError(lastError),
  };
}
