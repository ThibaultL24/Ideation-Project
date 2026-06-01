// tests/workshop-publish-plan.test.ts
import { describe, expect, it } from "vitest";
import { buildWorkshopPublishPlan } from "@/lib/workshop/publish-plan";
import type { WorkshopSession } from "@/lib/workshop/session";

describe("buildWorkshopPublishPlan", () => {
  it("flags missing triple draft in warnings", () => {
    const session: WorkshopSession = {
      id: "ws_test",
      createdAt: new Date().toISOString(),
      rawIntent: "Une app de reviews stakées pour outils IA",
      ideaBrief: {
        title: "AI Tool Reviews",
        oneLiner: "test",
        problem: "x".repeat(50),
        solution: "y".repeat(50),
        targetUsers: "builders",
        whyNow: "now",
        intuitionAngle: "signal",
        trustMechanism: "stake on quality claims",
        mvpScope: "mvp",
        openQuestions: ["Who stakes first?"],
      },
    };
    const idea = {
      canonicalId: "workshop-ws_test",
      slug: "workshop-ws_test",
      title: "AI Tool Reviews",
      tagline: "Staked reviews",
      category: "Workshop",
      categoryIndex: 1,
      ideaIndex: 1,
      description: "desc",
      tags: [],
      status: "draft" as const,
    };
    const plan = buildWorkshopPublishPlan(idea, null, session);
    expect(plan.readiness.warnings.some((w) => w.includes("Intuition triples"))).toBe(true);
    expect(plan.readiness.onchainReady).toBe(false);
    expect(plan.publishGuide.headline).toContain("Decentralized reputation");
  });
});
