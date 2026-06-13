// src/lib/ideas/synthesis-to-draft.ts
import type { IdeationChallenge } from "@/lib/assist/generate-ideation-challenge";
import type { IdeationSynthesis } from "@/lib/assist/generate-ideation-synthesize";
import type { BrainstormDraft } from "./publish-plan";

export function synthesisToBrainstormDraft(
  synthesis: IdeationSynthesis,
  intent: string,
  challenge?: IdeationChallenge | null,
): BrainstormDraft {
  const risks = [
    ...synthesis.risks,
    ...(challenge?.killerAssumptions.map((a) => `Hypothèse à valider : ${a}`) ?? []),
  ];

  return {
    archetype: "reputation",
    problem: intent,
    solution: synthesis.appDescription,
    users: "À préciser dans la description.",
    intuitionFit: synthesis.intuitionFit,
    mvp: synthesis.mvp,
    risks: risks.join("\n"),
    challenge: challenge
      ? [challenge.mainObjection, `Contre-direction : ${challenge.counterDirection}`].join("\n\n")
      : (synthesis.perspectives[0] ?? ""),
    supportTriples: "",
  };
}
