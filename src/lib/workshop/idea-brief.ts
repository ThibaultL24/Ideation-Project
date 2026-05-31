// src/lib/workshop/idea-brief.ts
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
): IdeaBrief {
  return {
    ...EMPTY_IDEA_BRIEF,
    ...(input ?? {}),
    title: input?.title?.trim() || fallbackTitle,
    openQuestions: normalizeOpenQuestions(input?.openQuestions),
    trustMechanism: input?.trustMechanism?.trim() ?? "",
  };
}

export function openQuestionsToText(questions: string[]): string {
  return questions.join("\n");
}

export function openQuestionsFromText(text: string): string[] {
  return normalizeOpenQuestions(text);
}
