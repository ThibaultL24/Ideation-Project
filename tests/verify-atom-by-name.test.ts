// tests/verify-atom-by-name.test.ts
import { describe, expect, it } from "vitest";
import {
  deriveProjectNameFromIntent,
  isExactProjectNameMatch,
  normalizeProjectName,
} from "../src/lib/ideas/verify-atom-by-name";

describe("normalizeProjectName", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeProjectName("  Cultural   GPS  ")).toBe("Cultural GPS");
  });
});

describe("isExactProjectNameMatch", () => {
  it("matches case-insensitively", () => {
    expect(isExactProjectNameMatch("TourGuideRep", "tourguiderep")).toBe(true);
  });

  it("rejects partial matches", () => {
    expect(isExactProjectNameMatch("Tour", "TourGuideRep")).toBe(false);
  });
});

describe("deriveProjectNameFromIntent", () => {
  it("prefers headline when provided", () => {
    expect(
      deriveProjectNameFromIntent(
        "une app GPS pour l'histoire",
        "HeritageWalk",
      ),
    ).toBe("HeritageWalk");
  });

  it("uses first sentence of intent otherwise", () => {
    expect(
      deriveProjectNameFromIntent(
        "HeritageWalk raconte l'histoire des lieux. Avec débats.",
      ),
    ).toBe("HeritageWalk raconte l'histoire des lieux");
  });
});
