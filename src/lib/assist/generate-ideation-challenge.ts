// src/lib/assist/generate-ideation-challenge.ts
import { z } from "zod";
import { buildFallbackIdeationChallenge } from "./fallback-ideation-challenge";
import {
  IDEATION_CHALLENGE_SYSTEM_PROMPT,
  buildIdeationChallengeUserMessage,
} from "./prompts-ideation-challenge";
import {
  formatAssistError,
  getAssistModelCandidates,
  getOpenAIClient,
  isAssistEnabled,
} from "./openai";

const challengeSchema = z.object({
  mainObjection: z.string().min(40),
  counterDirection: z.string().min(40),
  killerAssumptions: z.array(z.string().min(10)).min(2).max(5),
  openQuestions: z.array(z.string().min(10)).min(2).max(5),
  verdict: z.string().min(20),
});

export interface IdeationChallenge {
  mainObjection: string;
  counterDirection: string;
  killerAssumptions: string[];
  openQuestions: string[];
  verdict: string;
}

export interface GenerateIdeationChallengeInput {
  intent: string;
  headline: string;
  appDescription: string;
  intuitionFit: string;
  mvp: string;
  risks: string[];
  overlapMessage?: string;
}

export async function generateIdeationChallenge(
  input: GenerateIdeationChallengeInput,
): Promise<{
  challenge: IdeationChallenge;
  source: "openai" | "fallback";
  assistError?: string;
  modelUsed?: string;
}> {
  const fallback = () =>
    buildFallbackIdeationChallenge({
      headline: input.headline,
      intuitionFit: input.intuitionFit,
      overlapMessage: input.overlapMessage,
    });

  const client = getOpenAIClient();
  if (!isAssistEnabled() || !client) {
    return {
      challenge: fallback(),
      source: "fallback",
      assistError: "OPENAI_API_KEY missing or ASSIST_ENABLED=false",
    };
  }

  const userMessage = buildIdeationChallengeUserMessage(input);

  let lastError: unknown;
  for (const model of getAssistModelCandidates()) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.5,
        max_tokens: 1800,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: IDEATION_CHALLENGE_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty OpenAI response");

      const challenge = challengeSchema.parse(JSON.parse(raw));
      return { challenge, source: "openai", modelUsed: model };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    challenge: fallback(),
    source: "fallback",
    assistError: formatAssistError(lastError),
  };
}
