// tests/idea-brief-sheet.test.ts
import { describe, expect, it } from "vitest";
import {
  buildIdeaBriefSheetMarkdown,
  ideaBriefSheetFilename,
  slugifyBriefFilename,
  validateBriefForFinalize,
} from "@/lib/workshop/idea-brief-sheet";
import type { IdeaBrief } from "@/lib/workshop/idea-brief";

const sample: IdeaBrief = {
  title: "CinemaScope",
  oneLiner: "Cinema-centric cultural app for film enthusiasts.",
  problem: "Movie lovers lack a dedicated cinema exploration platform.",
  solution: "Curated recommendations and community engagement.",
  targetUsers: "Film buffs",
  whyNow: "Streaming diversity creates discovery fatigue.",
  intuitionAngle: "Graph-backed recommendations and staking on curation.",
  trustMechanism: "Stake on recommendations with counter-staking.",
  mvpScope: "Profiles, movie DB, community feed",
  openQuestions: ["How to seed the graph?"],
};

describe("idea-brief-sheet", () => {
  it("builds catalog-style markdown", () => {
    const md = buildIdeaBriefSheetMarkdown(sample, {
      finalizedAt: "2026-05-31T12:00:00.000Z",
      sessionId: "ws_test",
    });
    expect(md).toContain('title: "CinemaScope"');
    expect(md).toContain("## Problem");
    expect(md).toContain("## Open questions");
    expect(md).toContain("- How to seed the graph?");
  });

  it("validates required fields before finalize", () => {
    expect(validateBriefForFinalize(sample)).toBeNull();
    expect(validateBriefForFinalize({ ...sample, title: "" })).toMatch(/Title/);
  });

  it("slugifies download filename", () => {
    expect(slugifyBriefFilename("CinemaScope")).toBe("cinemascope");
    expect(ideaBriefSheetFilename(sample, "2026-05-31T12:00:00.000Z")).toBe(
      "2026-05-31-cinemascope-brief.md",
    );
  });
});
