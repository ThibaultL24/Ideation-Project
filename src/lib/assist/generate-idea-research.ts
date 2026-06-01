// src/lib/assist/generate-idea-research.ts
import { z } from "zod";
import { buildFallbackDeepResearch } from "./fallback-idea-research";
import type { GenerateIdeaResearchInput } from "./idea-research-input";
export type { GenerateIdeaResearchInput } from "./idea-research-input";
import { assistSynthesisResponseSchema } from "./schemas";
import type { DeepResearchReport } from "@/lib/workshop/idea-research";
import { normalizeIdeaBrief } from "@/lib/workshop/idea-brief";
import { graphContextForPrompt } from "@/lib/workshop/graph-context-types";
import {
  IDEA_RESEARCH_SYSTEM_PROMPT,
  buildIdeaResearchUserMessage,
} from "./prompts-idea-research";
import {
  normalizeRawResearchResponse,
} from "./normalize-research-response";
import {
  formatAssistError,
  getAssistModelCandidates,
  getOpenAIClient,
  isAssistEnabled,
} from "./openai";

const researchSchema = z.object({
  headline: z.string().min(10),
  similarIdeas: z
    .array(
      z.object({
        title: z.string(),
        source: z.enum(["catalog", "github", "graph"]),
        reason: z.string().min(8),
        url: z.string().optional(),
        slug: z.string().optional(),
        tagline: z.string().optional(),
      }),
    )
    .max(12)
    .default([]),
  diagnostic: z.object({
    summary: z.string().min(80),
    strengths: z.array(z.string().min(12)).min(3).max(10),
    weaknesses: z.array(z.string().min(12)).min(3).max(10),
  }),
  improvements: z
    .array(
      z.object({
        framework: z.string(),
        suggestion: z.string().min(40),
      }),
    )
    .min(6)
    .max(20),
  relatedIdeas: z
    .array(
      z.object({
        title: z.string(),
        pitch: z.string().min(20),
        angle: z.string(),
      }),
    )
    .min(2)
    .max(8),
  proposedBrief: assistSynthesisResponseSchema,
});

export interface DeepResearchResult {
  report: DeepResearchReport;
  source: "openai" | "fallback";
  assistError?: string;
  modelUsed?: string;
}

export async function generateDeepResearch(
  input: GenerateIdeaResearchInput,
): Promise<DeepResearchResult> {
  const graphSummary = input.graphContext
    ? graphContextForPrompt(input.graphContext)
    : { note: "No graph snapshot" };

  const client = getOpenAIClient();
  if (!isAssistEnabled() || !client) {
    return {
      report: buildFallbackDeepResearch(input),
      source: "fallback",
      assistError: "OPENAI_API_KEY missing or ASSIST_ENABLED=false",
    };
  }

  const userMessage = buildIdeaResearchUserMessage({
    prompt: input.prompt,
    ideaTitle: input.ideaTitle,
    catalogDescription: input.catalogDescription,
    overlapMessage: input.overlapMessage,
    explorationPrompt: input.explorationPrompt,
    selectedDirection: input.selectedDirection,
    catalogMatches: input.catalogMatches.map((m) => ({
      title: m.title,
      tagline: m.tagline,
      matchReason: m.matchReason,
      slug: m.slug,
    })),
    githubIssues: input.githubIssues.map((i) => ({
      title: i.title,
      url: i.url,
    })),
    graphSummary,
  });

  let lastError: unknown;
  for (const model of getAssistModelCandidates()) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.55,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: IDEA_RESEARCH_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty OpenAI response");

      const normalized = normalizeRawResearchResponse(JSON.parse(raw), input);
      const parsed = researchSchema.parse(normalized);
      return {
        report: {
          headline: parsed.headline,
          similarIdeas: parsed.similarIdeas,
          diagnostic: parsed.diagnostic,
          improvements: parsed.improvements,
          relatedIdeas: parsed.relatedIdeas,
          proposedBrief: normalizeIdeaBrief(
            parsed.proposedBrief as Parameters<typeof normalizeIdeaBrief>[0],
            input.ideaTitle,
            input.prompt,
          ),
          generatedAt: new Date().toISOString(),
        },
        source: "openai",
        modelUsed: model,
      };
    } catch (error) {
      lastError = error;
      const msg = formatAssistError(error);
      const noAccess = /does not have access to model/i.test(msg);
      if (!noAccess) break;
    }
  }

  return {
    report: buildFallbackDeepResearch(input),
    source: "fallback",
    assistError: formatAssistError(lastError),
  };
}
