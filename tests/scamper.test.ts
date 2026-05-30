// tests/scamper.test.ts
import { describe, expect, it } from "vitest";
import {
  buildScamperSynthesis,
  completedCount,
  emptyScamperAnswers,
  isStepComplete,
} from "../src/lib/ideas/scamper";

describe("scamper", () => {
  it("marks step complete with enough text", () => {
    const answers = emptyScamperAnswers();
    expect(isStepComplete(answers, "S")).toBe(false);
    answers.S = "Remplacer le classement centralisé par du signal.";
    expect(isStepComplete(answers, "S")).toBe(true);
  });

  it("builds synthesis from filled steps", () => {
    const answers = emptyScamperAnswers();
    answers.S = "Remplacer les avis par des attestations onchain.";
    answers.E = "Retirer les nested triples du MVP.";
    const text = buildScamperSynthesis("TrustRank", answers);
    expect(text).toContain("TrustRank");
    expect(text).toContain("Substituer");
    expect(text).toContain("Éliminer");
    expect(text).not.toContain("Combiner");
  });

  it("counts completed steps", () => {
    const answers = emptyScamperAnswers();
    answers.C = "Combiner curation et staking communautaire.";
    answers.R = "Inverser : la communauté propose avant l'auteur.";
    expect(completedCount(answers)).toBe(2);
  });
});
