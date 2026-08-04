// src/lib/assist/generate-ideation-elaborate.ts
import { z } from "zod";
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import type { Idea } from "@/lib/ideas/schema";
import {
  createResultId,
  draftSuggestionFields,
  getIdeationAction,
  ideationActionIdSchema,
  ideationActionResultSchema,
  type IdeationActionId,
  type IdeationActionResult,
} from "@/lib/ideas/ideation-actions";
import { buildFallbackIdeationElaborate } from "./fallback-ideation-elaborate";
import {
  IDEATION_ELABORATE_SYSTEM_PROMPT,
  buildIdeationElaborateUserMessage,
} from "./prompts-ideation-elaborate";
import {
  formatAssistError,
  getAssistModelCandidates,
  getOpenAIClient,
  isAssistEnabled,
} from "./openai";
import { generateIdeationChallenge } from "./generate-ideation-challenge";

const aiPayloadSchema = z.object({
  title: z.string().min(3).max(200),
  summary: z.string().min(20).max(2000),
  sections: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        content: z.string().min(1),
      }),
    )
    .min(1)
    .max(12),
  suggestions: z
    .array(
      z.object({
        targetField: z.enum(draftSuggestionFields),
        proposedValue: z.string().min(1),
        reason: z.string().optional(),
      }),
    )
    .max(12)
    .default([]),
});

export interface GenerateIdeationElaborateInput {
  action: IdeationActionId;
  idea: Idea;
  draft: BrainstormDraft;
  ideaVersion: number;
  intent?: string;
}

export interface GenerateIdeationElaborateOutput {
  result: IdeationActionResult;
  source: "openai" | "fallback";
  modelUsed?: string;
  assistError?: string | null;
}

function wrapAiResult(
  input: GenerateIdeationElaborateInput,
  payload: z.infer<typeof aiPayloadSchema>,
  source: "openai" | "fallback",
  extra?: { modelUsed?: string; assistError?: string },
): IdeationActionResult {
  const allowed = new Set(getIdeationAction(input.action).targetFields);
  const suggestions = payload.suggestions.filter(
    (s) => allowed.size === 0 || allowed.has(s.targetField),
  );

  return ideationActionResultSchema.parse({
    id: createResultId(),
    ideaId: input.idea.slug,
    ideaVersion: input.ideaVersion,
    action: input.action,
    title: payload.title,
    summary: payload.summary,
    sections: payload.sections,
    suggestions,
    status: "generated",
    createdAt: new Date().toISOString(),
    source,
    assistError: extra?.assistError,
  });
}

async function elaborateChallengeViaExistingEngine(
  input: GenerateIdeationElaborateInput,
): Promise<GenerateIdeationElaborateOutput | null> {
  if (!isAssistEnabled()) return null;

  const { challenge, source, assistError, modelUsed } = await generateIdeationChallenge({
    intent: input.intent?.trim() || input.idea.description,
    headline: input.idea.title,
    appDescription:
      input.draft.solution.trim() || input.draft.problem.trim() || input.idea.description,
    intuitionFit: input.draft.intuitionFit,
    mvp: input.draft.mvp,
    risks: input.draft.risks
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  });

  if (source !== "openai") return null;

  const result = wrapAiResult(
    input,
    {
      title: getIdeationAction("challenge").label,
      summary: challenge.verdict,
      sections: [
        { id: "objection", title: "Main objection", content: challenge.mainObjection },
        {
          id: "assumptions",
          title: "Critical assumptions",
          content: challenge.killerAssumptions.join("\n"),
        },
        {
          id: "questions",
          title: "Open questions",
          content: challenge.openQuestions.join("\n"),
        },
        {
          id: "counter",
          title: "Counter-direction",
          content: challenge.counterDirection,
        },
        { id: "verdict", title: "Verdict", content: challenge.verdict },
      ],
      suggestions: [
        {
          targetField: "challenge",
          proposedValue: `${challenge.mainObjection}\n\n${challenge.verdict}`,
          reason: "Store the challenge synthesis on the canonical draft",
        },
        {
          targetField: "risks",
          proposedValue: challenge.killerAssumptions.join("\n"),
          reason: "Surface critical assumptions as risks",
        },
      ],
    },
    "openai",
    { modelUsed, assistError },
  );

  return { result, source: "openai", modelUsed, assistError: assistError ?? null };
}

export async function generateIdeationElaborate(
  input: GenerateIdeationElaborateInput,
): Promise<GenerateIdeationElaborateOutput> {
  const action = ideationActionIdSchema.parse(input.action);

  if (action === "challenge") {
    const reused = await elaborateChallengeViaExistingEngine({ ...input, action });
    if (reused) return reused;
  }

  const fallbackResult = buildFallbackIdeationElaborate({ ...input, action });

  const client = getOpenAIClient();
  if (!isAssistEnabled() || !client) {
    return {
      result: {
        ...fallbackResult,
        assistError: "OPENAI_API_KEY missing or ASSIST_ENABLED=false",
      },
      source: "fallback",
      assistError: "OPENAI_API_KEY missing or ASSIST_ENABLED=false",
    };
  }

  const userMessage = buildIdeationElaborateUserMessage({ ...input, action });
  let lastError: unknown;

  for (const model of getAssistModelCandidates()) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.45,
        max_tokens: 2200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: IDEATION_ELABORATE_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty OpenAI response");

      const payload = aiPayloadSchema.parse(JSON.parse(raw));
      const result = wrapAiResult(input, payload, "openai", { modelUsed: model });
      return { result, source: "openai", modelUsed: model, assistError: null };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    result: {
      ...fallbackResult,
      assistError: formatAssistError(lastError),
    },
    source: "fallback",
    assistError: formatAssistError(lastError),
  };
}
