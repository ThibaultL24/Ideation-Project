// src/lib/workshop/idea-debrief.ts
/** Analyse critique après les questions de fin d'affinage — distinct de IdeaBrief. */

export interface DebriefAnswer {
  question: string;
  answer: string;
}

export interface IdeaAlternative {
  title: string;
  description: string;
  whenToChoose: string;
}

export interface IdeaDebrief {
  headline: string;
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  alternatives: IdeaAlternative[];
  intuitionFit: string;
  recommendation: "pursue" | "pivot" | "pause";
}

export const EMPTY_IDEA_DEBRIEF: IdeaDebrief = {
  headline: "",
  analysis: "",
  strengths: [],
  weaknesses: [],
  improvements: [],
  alternatives: [],
  intuitionFit: "",
  recommendation: "pause",
};

export function normalizeIdeaDebrief(
  input: Partial<IdeaDebrief> | null | undefined,
): IdeaDebrief {
  const rec = input?.recommendation;
  const recommendation =
    rec === "pursue" || rec === "pivot" || rec === "pause" ? rec : "pause";

  return {
    headline: input?.headline?.trim() ?? "",
    analysis: input?.analysis?.trim() ?? "",
    strengths: (input?.strengths ?? []).map((s) => s.trim()).filter(Boolean),
    weaknesses: (input?.weaknesses ?? []).map((s) => s.trim()).filter(Boolean),
    improvements: (input?.improvements ?? []).map((s) => s.trim()).filter(Boolean),
    alternatives: (input?.alternatives ?? [])
      .map((a) => ({
        title: a.title?.trim() ?? "",
        description: a.description?.trim() ?? "",
        whenToChoose: a.whenToChoose?.trim() ?? "",
      }))
      .filter((a) => a.title),
    intuitionFit: input?.intuitionFit?.trim() ?? "",
    recommendation,
  };
}
