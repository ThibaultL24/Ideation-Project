// src/lib/ideas/ideation-actions.ts
import { z } from "zod";

export const ideationActionIds = [
  "clarify",
  "intuition-fit",
  "mvp",
  "plan",
  "challenge",
] as const;

export type IdeationActionId = (typeof ideationActionIds)[number];

export const draftSuggestionFields = [
  "problem",
  "solution",
  "users",
  "intuitionFit",
  "mvp",
  "risks",
  "challenge",
  "supportTriples",
] as const;

export type DraftSuggestionField = (typeof draftSuggestionFields)[number];

export const ideationActionIdSchema = z.enum(ideationActionIds);

export type IdeationActionDefinition = {
  id: IdeationActionId;
  label: string;
  description: string;
  outcome: string;
  requiresExistingDraft: boolean;
  targetFields: DraftSuggestionField[];
};

/** Central registry — labels stay outcome-oriented (no method names in UI). */
export const IDEATION_ACTION_REGISTRY: Record<
  IdeationActionId,
  IdeationActionDefinition
> = {
  clarify: {
    id: "clarify",
    label: "Make the idea clearer",
    description:
      "Turn a fuzzy formulation into a precise problem, solution, and audience.",
    outcome: "Clearer problem, solution, and users",
    requiresExistingDraft: false,
    targetFields: ["problem", "solution", "users"],
  },
  "intuition-fit": {
    id: "intuition-fit",
    label: "Check its Intuition fit",
    description: "Test whether Intuition atoms, triples, and signal are truly needed.",
    outcome: "Honest fit analysis and support triples",
    requiresExistingDraft: false,
    targetFields: ["intuitionFit", "supportTriples"],
  },
  mvp: {
    id: "mvp",
    label: "Define the MVP",
    description: "Ship the smallest version that can validate the core hypothesis.",
    outcome: "Focused MVP scope",
    requiresExistingDraft: false,
    targetFields: ["mvp"],
  },
  plan: {
    id: "plan",
    label: "Build an initial plan",
    description: "A light path from framing to first publish — not a project tracker.",
    outcome: "Step-by-step elaboration plan",
    requiresExistingDraft: false,
    targetFields: [],
  },
  challenge: {
    id: "challenge",
    label: "Challenge the proposal",
    description:
      "Stress-test a draft that already has substance. Optional after elaboration.",
    outcome: "Objections, risks, and a nuanced verdict",
    requiresExistingDraft: true,
    targetFields: ["challenge", "risks"],
  },
};

export function isIdeationActionId(value: string): value is IdeationActionId {
  return ideationActionIds.includes(value as IdeationActionId);
}

export function getIdeationAction(id: IdeationActionId): IdeationActionDefinition {
  return IDEATION_ACTION_REGISTRY[id];
}

export function listIdeationActions(): IdeationActionDefinition[] {
  return ideationActionIds.map((id) => IDEATION_ACTION_REGISTRY[id]);
}

const suggestionSchema = z.object({
  targetField: z.enum(draftSuggestionFields),
  proposedValue: z.string().min(1),
  reason: z.string().optional(),
});

const sectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
});

export const ideationActionResultSchema = z.object({
  id: z.string().min(1),
  ideaId: z.string().min(1),
  ideaVersion: z.number().int().nonnegative(),
  action: ideationActionIdSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  sections: z.array(sectionSchema).min(1).max(12),
  suggestions: z.array(suggestionSchema).max(12),
  status: z.enum(["generated", "accepted", "rejected"]),
  createdAt: z.string().min(1),
  source: z.enum(["openai", "fallback"]).optional(),
  assistError: z.string().optional(),
});

export type IdeationActionResult = z.infer<typeof ideationActionResultSchema>;

export const ideaVersionOriginSchema = z.enum([
  "initial",
  "clarification",
  "intuition-fit",
  "mvp",
  "plan",
  "challenge",
  "user-edit",
  "publication",
]);

export type IdeaVersionOrigin = z.infer<typeof ideaVersionOriginSchema>;

export const ideaVersionSchema = z.object({
  id: z.string().min(1),
  ideaId: z.string().min(1),
  version: z.number().int().positive(),
  snapshot: z.record(z.unknown()),
  origin: ideaVersionOriginSchema,
  sourceResultId: z.string().optional(),
  changesSummary: z.string().min(1),
  createdAt: z.string().min(1),
  published: z
    .object({
      network: z.string().optional(),
      githubPrUrl: z.string().optional(),
      ideaAtomId: z.string().optional(),
      tripleTermId: z.string().optional(),
      txHashes: z.array(z.string()).optional(),
    })
    .optional(),
});

export type IdeaVersion = z.infer<typeof ideaVersionSchema>;

export function actionIdToVersionOrigin(
  action: IdeationActionId,
): Exclude<IdeaVersionOrigin, "initial" | "user-edit" | "publication"> {
  if (action === "clarify") return "clarification";
  return action;
}

export function createResultId(): string {
  return `res_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createVersionId(): string {
  return `ver_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
