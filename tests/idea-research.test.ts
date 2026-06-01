// tests/idea-research.test.ts
import { describe, expect, it } from "vitest";
import { RESEARCH_SECTIONS } from "@/lib/workshop/idea-research";

describe("deep research", () => {
  it("defines 5 report sections", () => {
    expect(RESEARCH_SECTIONS).toHaveLength(5);
    expect(RESEARCH_SECTIONS.map((s) => s.title)).toEqual([
      "Similar ideas",
      "Diagnostic",
      "Improvement ideas",
      "Related concepts",
      "Proposed idea brief",
    ]);
  });
});
