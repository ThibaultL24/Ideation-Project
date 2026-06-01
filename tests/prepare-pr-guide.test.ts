// tests/prepare-pr-guide.test.ts
import { describe, expect, it } from "vitest";
import { buildPreparePrGuide } from "@/lib/workshop/prepare-pr-guide";

describe("buildPreparePrGuide", () => {
  it("builds rich sections and idea-specific core triple", () => {
    const guide = buildPreparePrGuide({
      ideaTitle: "StoryExplorer",
      coreSubject: "StoryExplorer",
      tagline: "Stories on a map",
      githubPath: "ideas/2026-05-31-story-explorer/README.md",
    });
    expect(guide.sections.length).toBeGreaterThanOrEqual(5);
    expect(guide.coreTripleLine).toContain("StoryExplorer");
    expect(guide.summary).toContain("StoryExplorer");
    expect(guide.checklist.some((c) => c.includes("on-chain"))).toBe(true);
    expect(guide.sections.find((s) => s.id === "vision")?.paragraphs?.length).toBeGreaterThan(0);
  });
});
