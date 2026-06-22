// tests/refine-triple-draft.test.ts
import { describe, expect, it } from "vitest";
import { refineTripleDraft } from "@/lib/assist/refine-triple-draft";
import { normalizeTripleDraft } from "@/lib/workshop/triple-draft";

describe("refineTripleDraft", () => {
  it("forces canonical core triple and filters vague support", () => {
    const raw = normalizeTripleDraft(
      {
        coreTriple: {
          subject: "Wrong",
          predicate: "is good",
          object: "quality",
          rationale: "bad",
          kind: "core",
          recommended: true,
        },
        supportTriples: [
          {
            subject: "My App",
            predicate: "is good",
            object: "users",
            rationale: "vague",
            kind: "support",
            recommended: true,
          },
        ],
        refinedPitch: "x".repeat(50),
      },
      "My App",
    );

    const refined = refineTripleDraft(raw, {
      ideaTitle: "j'aimerais créer une application pour vétérinaires",
      rawIntent: "j'aimerais créer une application pour vétérinaires",
      ideaBrief: {
        title: "My App",
        oneLiner: "pitch",
        problem: "Vets lack trusted reviews.",
        solution: "Staked reviews.",
        targetUsers: "Pet owners in cities",
        whyNow: "now",
        intuitionAngle: "graph",
        trustMechanism: "stake on visit claims",
        mvpScope: "mvp",
        openQuestions: [],
      },
      popularPredicates: [{ label: "targets" }],
    });

    expect(refined.coreTriple.predicate).toBe("top project ideas for");
    expect(refined.coreTriple.object).toBe("Intuition Protocol");
    expect(refined.coreTriple.subject).toBe("My App");
    expect(refined.supportTriples.some((t) => t.predicate === "is good")).toBe(false);
    expect(refined.supportTriples.length).toBeGreaterThanOrEqual(2);
  });

  it("replaces long French intent with short atom on core triple", () => {
    const raw = normalizeTripleDraft(
      {
        supportTriples: [
          {
            subject: "j'aimerai créer une application culturelle",
            predicate: "top project ideas for",
            object: "Early adopters à définir",
            rationale: "bad duplicate core",
            kind: "support",
            recommended: true,
          },
          {
            subject: "j'aimerai créer une application culturelle",
            predicate: "solves",
            object: "j'aimerai créer une application culturelle, un gp",
            rationale: "bad",
            kind: "support",
            recommended: true,
          },
        ],
        refinedPitch: "x".repeat(50),
      },
      "j'aimerai créer une application culturelle, un gps historique",
    );

    const refined = refineTripleDraft(raw, {
      ideaTitle: "j'aimerai créer une application culturelle, un gps historique",
      rawIntent:
        "j'aimerai créer une application culturelle, un gps historique qui afficherait le tracé de la vie des gens",
      ideaBrief: {
        title: "j'aimerai créer une application culturelle, un gps historique",
        oneLiner: "GPS culturel pour suivre le tracé de vie des personnes historiques.",
        problem: "Les visiteurs manquent de contexte historique sur les lieux.",
        solution: "Carte avec tracés de vie attestés sur le graphe.",
        targetUsers: "Touristes culturels et éducateurs",
        whyNow: "now",
        intuitionAngle: "Claims géolocalisées stakées",
        trustMechanism: "Historiens et habitants stakent sur l'exactitude des tracés",
        mvpScope: "Carte + 3 parcours pilotes",
        openQuestions: [],
      },
    });

    expect(refined.coreTriple.subject.toLowerCase()).toContain("gps");
    expect(refined.coreTriple.object).toBe("Intuition Protocol");
    expect(
      refined.supportTriples.every((t) => t.predicate !== "top project ideas for"),
    ).toBe(true);
    expect(
      refined.supportTriples.every((t) => !t.object.toLowerCase().includes("j'aimerai")),
    ).toBe(true);
  });
});
