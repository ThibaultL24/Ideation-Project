// src/lib/assist/generate-brainstorm.ts
import { z } from "zod";
import type { BrainstormReport } from "@/lib/workshop/brainstorm";
import { graphContextForPrompt } from "@/lib/workshop/graph-context-types";
import { buildFallbackBrainstorm } from "./fallback-brainstorm";
import type { GenerateIdeaResearchInput } from "./idea-research-input";
import { normalizeBrainstormResponse } from "./normalize-brainstorm-response";
import {
  BRAINSTORM_SYSTEM_PROMPT,
  buildBrainstormUserMessage,
} from "./prompts-brainstorm";
import {
  formatAssistError,
  getAssistModelCandidates,
  getOpenAIClient,
  isAssistEnabled,
} from "./openai";

export interface GenerateBrainstormInput extends GenerateIdeaResearchInput {
  explorationPrompt: string;
}

const directionSchema = z.object({
  id: z.string(),
  title: z.string().min(2),
  tagline: z.string().min(15),
  angle: z.string().min(2),
  problemHook: z.string().min(30),
  intuitionFit: z.string().min(30),
  mvpSketch: z.string().min(20),
  whyInteresting: z.string().min(20),
  risks: z.array(z.string().min(5)).min(1).max(4),
});

const brainstormSchema = z.object({
  territory: z.string().min(40),
  clarifyingQuestions: z.array(z.string().min(10)).min(3).max(6),
  directions: z.array(directionSchema).min(4).max(6),
  recommendedDirectionId: z.string().optional(),
});

export interface BrainstormResult {
  report: BrainstormReport;
  source: "openai" | "fallback";
  assistError?: string;
  modelUsed?: string;
}

function repairDirections(
  normalized: Record<string, unknown>,
  input: GenerateBrainstormInput,
): Record<string, unknown> {
  let directions = normalized.directions as z.infer<typeof directionSchema>[] | undefined;
  if (!Array.isArray(directions) || directions.length < 4) {
    const fallback = buildFallbackBrainstorm(input);
    directions = fallback.directions;
  }
  while (directions.length < 5) {
    const seed = directions[directions.length % directions.length];
    if (!seed) break;
    directions.push({
      ...seed,
      id: `direction-${directions.length + 1}`,
      title: `${seed.title} (variant)`,
    });
  }
  return {
    ...normalized,
    directions: directions.slice(0, 5),
    recommendedDirectionId:
      normalized.recommendedDirectionId ?? directions[0]?.id,
  };
}

export async function generateBrainstorm(
  input: GenerateBrainstormInput,
): Promise<BrainstormResult> {
  const graphSummary = input.graphContext
    ? graphContextForPrompt(input.graphContext)
    : { note: "No graph snapshot" };

  const client = getOpenAIClient();
  if (!isAssistEnabled() || !client) {
    return {
      report: buildFallbackBrainstorm(input),
      source: "fallback",
      assistError: "OPENAI_API_KEY missing or ASSIST_ENABLED=false",
    };
  }

  const userMessage = buildBrainstormUserMessage({
    explorationPrompt: input.explorationPrompt,
    ideaTitle: input.ideaTitle,
    catalogDescription: input.catalogDescription,
    overlapMessage: input.overlapMessage,
    catalogMatches: input.catalogMatches.map((m) => ({
      title: m.title,
      tagline: m.tagline,
      matchReason: m.matchReason,
      slug: m.slug,
    })),
    githubIssues: input.githubIssues.map((i) => ({ title: i.title, url: i.url })),
    graphSummary,
  });

  let lastError: unknown;
  for (const model of getAssistModelCandidates()) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: BRAINSTORM_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty OpenAI response");

      const normalized = repairDirections(
        normalizeBrainstormResponse(JSON.parse(raw), input),
        input,
      );
      const parsed = brainstormSchema.parse(normalized);

      return {
        report: {
          territory: parsed.territory,
          clarifyingQuestions: parsed.clarifyingQuestions,
          directions: parsed.directions,
          recommendedDirectionId: parsed.recommendedDirectionId,
          generatedAt: new Date().toISOString(),
        },
        source: "openai",
        modelUsed: model,
      };
    } catch (error) {
      lastError = error;
      const msg = formatAssistError(error);
      if (!/does not have access to model/i.test(msg)) break;
    }
  }

  return {
    report: buildFallbackBrainstorm(input),
    source: "fallback",
    assistError: formatAssistError(lastError),
  };
}
