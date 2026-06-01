// tests/workshop-path.test.ts
import { describe, expect, it } from "vitest";
import type { BrainstormDirection } from "@/lib/workshop/brainstorm";
import type { WorkshopSession } from "@/lib/workshop/session";
import {
  canOpenPrepare,
  resolveSessionBrief,
  seedBriefFromDirection,
  seedBriefFromPreciseIntent,
} from "@/lib/workshop/workshop-path";

const direction: BrainstormDirection = {
  id: "dir-1",
  title: "Heritage Walks",
  tagline: "Trust layers for local guides",
  angle: "community",
  problemHook: "Tourists cannot verify guide quality.",
  intuitionFit: "Stake on guide claims and disputes.",
  mvpSketch: "Map + short attestations per stop.",
  whyInteresting: "Combines culture and portable trust.",
  risks: ["Cold start on staking"],
};

describe("workshop-path", () => {
  it("seeds brief from brainstorm direction", () => {
    const brief = seedBriefFromDirection(direction, "culture and walks");
    expect(brief.title).toBe("Heritage Walks");
    expect(brief.problem).toContain("verify guide");
  });

  it("seeds brief from precise intent", () => {
    const session: WorkshopSession = {
      id: "ws_1",
      createdAt: new Date().toISOString(),
      path: "precise",
      rawIntent: "A staking dashboard for AI tool reviews with Intuition graph reads.",
    };
    const brief = seedBriefFromPreciseIntent(session);
    expect(brief.problem).toContain("staking dashboard");
  });

  it("canOpenPrepare for precise path with raw intent only", () => {
    const session: WorkshopSession = {
      id: "ws_2",
      createdAt: new Date().toISOString(),
      path: "precise",
      rawIntent: "Clear product idea with enough characters here.",
    };
    expect(canOpenPrepare(session)).toBe(true);
  });

  it("canOpenPrepare for explore with selected direction", () => {
    const session: WorkshopSession = {
      id: "ws_3",
      createdAt: new Date().toISOString(),
      path: "explore",
      rawIntent: "explore cinema",
      selectedDirection: direction,
    };
    expect(canOpenPrepare(session)).toBe(true);
    const brief = resolveSessionBrief(session);
    expect(brief.title).toBe("Heritage Walks");
  });

  it("cannot open prepare without intent", () => {
    const session: WorkshopSession = {
      id: "ws_4",
      createdAt: new Date().toISOString(),
      path: "explore",
      rawIntent: "",
    };
    expect(canOpenPrepare(session)).toBe(false);
  });
});
