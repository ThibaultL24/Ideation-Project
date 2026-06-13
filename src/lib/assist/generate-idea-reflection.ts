// src/lib/assist/generate-idea-reflection.ts
import { z } from "zod";
import type { Idea } from "@/lib/ideas/schema";
import type { IdeaReflectionReport } from "@/lib/ideas/idea-reflection";
import type { BrainstormArchetype } from "@/lib/ideas/publish-plan";
import { graphContextForPrompt } from "@/lib/workshop/graph-context-types";
import type { CatalogMatch } from "@/lib/workshop/discover-similar";
import type { GithubIssueHit } from "@/lib/workshop/github-discover";
import type { WorkshopGraphContext } from "@/lib/workshop/graph-context-types";
import { buildFallbackIdeaReflection } from "./fallback-idea-reflection";
import {
  IDEA_REFLECTION_SYSTEM_PROMPT,
  buildIdeaReflectionUserMessage,
} from "./prompts-idea-reflection";
import {
  formatAssistError,
  getAssistModelCandidates,
  getOpenAIClient,
  isAssistEnabled,
} from "./openai";

const archetypeSchema = z.enum([
  "curated-list",
  "reputation",
  "social-attestation",
  "risk-detection",
  "prediction-signal",
  "agent-memory",
]);

const reflectionSchema = z.object({
  headline: z.string().min(10),
  reflection: z.string().min(80),
  strengths: z.array(z.string().min(10)).min(2).max(6),
  weaknesses: z.array(z.string().min(10)).min(2).max(6),
  problem: z.string().min(40),
  solution: z.string().min(40),
  users: z.string().min(20),
  intuitionFit: z.string().min(40),
  mvp: z.string().min(30),
  risks: z.array(z.string().min(8)).min(2).max(5),
  challenge: z.string().min(20),
  archetype: archetypeSchema,
  ecosystemNote: z.string().min(20),
});

export interface GenerateIdeaReflectionInput {
  idea: Idea;
  userAngle?: string;
  graphContext?: WorkshopGraphContext | null;
  catalogMatches: CatalogMatch[];
  githubIssues: GithubIssueHit[];
  overlapMessage?: string;
}

export interface IdeaReflectionResult {
  report: IdeaReflectionReport;
  source: "openai" | "fallback";
  assistError?: string;
  modelUsed?: string;
}

export async function generateIdeaReflection(
  input: GenerateIdeaReflectionInput,
): Promise<IdeaReflectionResult> {
  const graphSummary = input.graphContext
    ? graphContextForPrompt(input.graphContext)
    : { note: "No graph snapshot" };

  const client = getOpenAIClient();
  if (!isAssistEnabled() || !client) {
    return {
      report: buildFallbackIdeaReflection(
        input.idea,
        input.overlapMessage,
        input.userAngle,
      ),
      source: "fallback",
      assistError: "OPENAI_API_KEY missing or ASSIST_ENABLED=false",
    };
  }

  const userMessage = buildIdeaReflectionUserMessage({
    ideaTitle: input.idea.title,
    ideaTagline: input.idea.tagline,
    ideaDescription: input.idea.description,
    ideaCategory: input.idea.category,
    userAngle: input.userAngle,
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
        temperature: 0.5,
        max_tokens: 3000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: IDEA_REFLECTION_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty OpenAI response");

      const parsed = reflectionSchema.parse(JSON.parse(raw));

      return {
        report: {
          ...parsed,
          archetype: parsed.archetype as BrainstormArchetype,
          generatedAt: new Date().toISOString(),
        },
        source: "openai",
        modelUsed: model,
      };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    report: buildFallbackIdeaReflection(
      input.idea,
      input.overlapMessage,
      input.userAngle,
    ),
    source: "fallback",
    assistError: formatAssistError(lastError),
  };
}
