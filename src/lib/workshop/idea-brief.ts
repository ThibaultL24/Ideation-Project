// src/lib/workshop/idea-brief.ts
import { deriveAtomLabel } from "./atom-label";

/** Synthèse produit — pas encore de triples Intuition. */

export interface IdeaBrief {
  title: string;
  oneLiner: string;
  problem: string;
  solution: string;
  targetUsers: string;
  whyNow: string;
  intuitionAngle: string;
  trustMechanism: string;
  mvpScope: string;
  openQuestions: string[];
}

export const EMPTY_IDEA_BRIEF: IdeaBrief = {
  title: "",
  oneLiner: "",
  problem: "",
  solution: "",
  targetUsers: "",
  whyNow: "",
  intuitionAngle: "",
  trustMechanism: "",
  mvpScope: "",
  openQuestions: [],
};

function coerceBriefString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item)))
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function normalizeOpenQuestions(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((q) => q.trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n+/)
      .map((q) => q.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeIdeaBrief(
  input: Partial<IdeaBrief> & { openQuestions?: string | string[] } | null | undefined,
  fallbackTitle: string,
  rawIntent?: string,
): IdeaBrief {
  const title = deriveAtomLabel({
    title: input?.title,
    oneLiner: input?.oneLiner,
    rawIntent: rawIntent ?? fallbackTitle,
    fallback: fallbackTitle,
  });

  const partial = input ?? {};

  return {
    ...EMPTY_IDEA_BRIEF,
    title,
    oneLiner: coerceBriefString(partial.oneLiner),
    problem: coerceBriefString(partial.problem),
    solution: coerceBriefString(partial.solution),
    targetUsers: coerceBriefString(partial.targetUsers),
    whyNow: coerceBriefString(partial.whyNow),
    intuitionAngle: coerceBriefString(partial.intuitionAngle),
    trustMechanism: coerceBriefString(partial.trustMechanism),
    mvpScope: coerceBriefString(partial.mvpScope),
    openQuestions: normalizeOpenQuestions(partial.openQuestions),
  };
}

export function openQuestionsToText(questions: string[]): string {
  return questions.join("\n");
}

export function openQuestionsFromText(text: string): string[] {
  return normalizeOpenQuestions(text);
}
