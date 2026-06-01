// tests/atom-label.test.ts
import { describe, expect, it } from "vitest";
import { deriveAtomLabel, isIntentLikeLabel } from "@/lib/workshop/atom-label";

describe("atom-label", () => {
  it("detects raw intent as poor label", () => {
    expect(
      isIntentLikeLabel(
        "j'aimerai créer une application culturelle, un gps historique",
      ),
    ).toBe(true);
  });

  it("extracts short product name from French intent", () => {
    const label = deriveAtomLabel({
      title: "j'aimerai créer une application culturelle, un gps historique quia fficherait le",
      rawIntent:
        "j'aimerai créer une application culturelle, un gps historique qui afficherait le tracé de la vie des gens",
    });
    expect(label.toLowerCase()).toContain("gps");
    expect(label.length).toBeLessThanOrEqual(48);
    expect(isIntentLikeLabel(label)).toBe(false);
  });

  it("keeps a good explicit title", () => {
    expect(
      deriveAtomLabel({
        title: "LifePath Maps",
        rawIntent: "long intent…",
      }),
    ).toBe("LifePath Maps");
  });
});
