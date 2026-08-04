// src/lib/ideas/skill-idea-import.ts
import { z } from "zod";
import type { BrainstormDraft } from "./publish-plan";
import { DEFAULT_BRAINSTORM_DRAFT, normalizeBrainstormDraft } from "./publish-plan";

export const skillIdeaImportSchema = z.object({
  version: z.literal(1),
  source: z.literal("intuition-ideation-skill"),
  title: z.string().min(2).max(160),
  summary: z.string().min(10).max(4000),
  problem: z.string().max(4000).optional(),
  solution: z.string().max(4000).optional(),
  users: z.string().max(2000).optional(),
  intuitionFit: z.string().max(4000).optional(),
  mvp: z.string().max(4000).optional(),
  risks: z.array(z.string().min(1)).max(20).optional(),
});

export type SkillIdeaImport = z.infer<typeof skillIdeaImportSchema>;

export type SkillImportParseResult =
  | { ok: true; data: SkillIdeaImport }
  | { ok: false; error: string };

export function parseSkillIdeaImport(raw: unknown): SkillImportParseResult {
  const parsed = skillIdeaImportSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.join(".") || "payload";
    return {
      ok: false,
      error: `Invalid skill import (${path}): ${issue?.message ?? "validation failed"}`,
    };
  }
  return { ok: true, data: parsed.data };
}

export function parseSkillIdeaImportText(text: string): SkillImportParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "Paste valid JSON from the Intuition Ideation Skill." };
  }
  return parseSkillIdeaImport(json);
}

/** Map a confirmed skill import into BrainstormDraft fields (no publish side-effects). */
export function skillImportToDraft(data: SkillIdeaImport): BrainstormDraft {
  return normalizeBrainstormDraft({
    ...DEFAULT_BRAINSTORM_DRAFT,
    problem: data.problem?.trim() || data.summary.trim(),
    solution: data.solution?.trim() || "",
    users: data.users?.trim() || "",
    intuitionFit: data.intuitionFit?.trim() || "",
    mvp: data.mvp?.trim() || "",
    risks: data.risks?.join("\n") || "",
  });
}
