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
  mvpScope: string;
  openQuestions: string;
}

export const EMPTY_IDEA_BRIEF: IdeaBrief = {
  title: "",
  oneLiner: "",
  problem: "",
  solution: "",
  targetUsers: "",
  whyNow: "",
  intuitionAngle: "",
  mvpScope: "",
  openQuestions: "",
};

export function normalizeIdeaBrief(
  input: Partial<IdeaBrief> | null | undefined,
  fallbackTitle: string,
): IdeaBrief {
  return {
    ...EMPTY_IDEA_BRIEF,
    ...(input ?? {}),
    title: input?.title?.trim() || fallbackTitle,
  };
}
