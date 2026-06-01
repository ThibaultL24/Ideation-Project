// tests/resolve-idea.test.ts
import { describe, expect, it } from "vitest";
import { resolveIdeaFromSession } from "@/lib/workshop/resolve-idea";
import type { WorkshopSession } from "@/lib/workshop/session";

describe("resolveIdeaFromSession", () => {
  it("uses ideaBrief title and oneLiner instead of raw exploration intent", () => {
    const session: WorkshopSession = {
      id: "ws_x",
      createdAt: new Date().toISOString(),
      path: "explore",
      rawIntent:
        "Territory: philosophy and culture. Direction: PhilosophyPulse — debates with staking.",
      explorationPrompt: "I want to explore philosophy apps and intellectual communities",
      ideaBrief: {
        title: "PhilosophyPulse",
        oneLiner:
          "Foster intellectual growth through real-time philosophical debates with reputation staking.",
        problem: "Debate quality is hard to verify online.",
        solution: "Live debates with stake-weighted reputation.",
        targetUsers: "Philosophy students and curious adults",
        whyNow: "Remote discourse is everywhere.",
        intuitionAngle: "Stake on claim quality and moderator fairness.",
        trustMechanism: "Counter-staking on disputed claims.",
        mvpScope: "Weekly themed rooms + leaderboards.",
        openQuestions: ["How to bootstrap stakers?"],
      },
    };

    const idea = resolveIdeaFromSession(session);
    expect(idea.title).toBe("PhilosophyPulse");
    expect(idea.tagline).toContain("philosophical debates");
    expect(idea.tagline).not.toContain("Territory:");
  });
});
