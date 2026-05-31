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
      ideaTitle: "My App",
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
      popularPredicates: [{ label: "targets", term_id: "0x1", usage: 10 }],
    });

    expect(refined.coreTriple.predicate).toBe("top project ideas for");
    expect(refined.coreTriple.object).toBe("Intuition Protocol");
    expect(refined.coreTriple.subject).toBe("My App");
    expect(refined.supportTriples.some((t) => t.predicate === "is good")).toBe(false);
    expect(refined.supportTriples.length).toBeGreaterThanOrEqual(2);
  });
});
