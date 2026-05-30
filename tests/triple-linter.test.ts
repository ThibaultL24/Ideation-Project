// tests/triple-linter.test.ts
import { describe, expect, it } from "vitest";
import {
  defaultCoreTriple,
  normalizeTripleDraft,
  runTripleLinter,
} from "@/lib/workshop/triple-draft";

describe("triple-linter", () => {
  it("warns on composite atom labels", () => {
    const draft = normalizeTripleDraft(
      {
        coreTriple: {
          ...defaultCoreTriple("Foo and Bar"),
          subject: "Foo and Bar",
        },
        refinedPitch: "x".repeat(50),
      },
      "Foo and Bar",
    );
    const warnings = runTripleLinter(draft);
    expect(warnings.some((w) => w.includes("composites"))).toBe(true);
  });

  it("core triple uses bounty predicate", () => {
    const draft = normalizeTripleDraft({}, "StakeReview");
    expect(draft.coreTriple.predicate).toBe("top project ideas for");
    expect(draft.coreTriple.object).toBe("Intuition");
  });
});
