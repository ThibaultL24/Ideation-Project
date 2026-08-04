// tests/ideation-actions.test.ts
import { describe, expect, it } from "vitest";
import {
  ideationActionIds,
  ideationActionIdSchema,
  ideationActionResultSchema,
  IDEATION_ACTION_REGISTRY,
  listIdeationActions,
  createResultId,
} from "@/lib/ideas/ideation-actions";
import { applyIdeationSuggestions } from "@/lib/ideas/apply-ideation-suggestions";
import { DEFAULT_BRAINSTORM_DRAFT } from "@/lib/ideas/publish-plan";
import { buildPublishPlan } from "@/lib/ideas/publish-plan";
import { buildFallbackIdeationElaborate } from "@/lib/assist/fallback-ideation-elaborate";
import { parseSkillIdeaImport, skillImportToDraft } from "@/lib/ideas/skill-idea-import";
import {
  emptyIdeaHistory,
  parseIdeaHistory,
  buildAcceptedVersion,
  HISTORY_STORAGE_VERSION,
} from "@/lib/ideas/idea-history";
import type { Idea } from "@/lib/ideas/schema";

const sampleIdea: Idea = {
  canonicalId: "idea-test-1",
  slug: "sample-idea",
  title: "SampleIdea",
  tagline: "A test idea for Intuition",
  category: "DeFi",
  categoryIndex: 1,
  ideaIndex: 1,
  description: "Users need a clearer way to trust claims on-chain.",
  tags: ["test"],
  status: "draft",
};

describe("ideation actions domain", () => {
  it("exposes five valid action ids", () => {
    expect(ideationActionIds).toEqual([
      "clarify",
      "intuition-fit",
      "mvp",
      "plan",
      "challenge",
    ]);
  });

  it("rejects unknown action ids", () => {
    expect(ideationActionIdSchema.safeParse("scamper").success).toBe(false);
  });

  it("has a complete registry entry for each action", () => {
    for (const id of ideationActionIds) {
      const def = IDEATION_ACTION_REGISTRY[id];
      expect(def.id).toBe(id);
      expect(def.label.length).toBeGreaterThan(3);
      expect(def.description.length).toBeGreaterThan(10);
      expect(def.outcome.length).toBeGreaterThan(3);
      expect(Array.isArray(def.targetFields)).toBe(true);
    }
    expect(listIdeationActions()).toHaveLength(5);
  });

  it("validates action results with Zod", () => {
    const result = ideationActionResultSchema.parse({
      id: createResultId(),
      ideaId: sampleIdea.slug,
      ideaVersion: 1,
      action: "mvp",
      title: "Define the MVP",
      summary: "A short summary of the MVP proposal for testing.",
      sections: [{ id: "s1", title: "Scope", content: "Keep it tiny." }],
      suggestions: [
        {
          targetField: "mvp",
          proposedValue: "One feed + one attest action",
        },
      ],
      status: "generated",
      createdAt: new Date().toISOString(),
    });
    expect(result.action).toBe("mvp");
  });

  it("rejects suggestions targeting unknown fields", () => {
    const parsed = ideationActionResultSchema.safeParse({
      id: "x",
      ideaId: "y",
      ideaVersion: 1,
      action: "mvp",
      title: "t",
      summary: "summary long enough here",
      sections: [{ id: "a", title: "A", content: "B" }],
      suggestions: [{ targetField: "title", proposedValue: "nope" }],
      status: "generated",
      createdAt: new Date().toISOString(),
    });
    expect(parsed.success).toBe(false);
  });

  it("keeps idea and result as distinct objects", () => {
    const result = buildFallbackIdeationElaborate({
      action: "clarify",
      idea: sampleIdea,
      draft: DEFAULT_BRAINSTORM_DRAFT,
      ideaVersion: 1,
    });
    expect(result.ideaId).toBe(sampleIdea.slug);
    expect(result).not.toHaveProperty("canonicalId");
    expect(sampleIdea).not.toHaveProperty("suggestions");
  });
});

describe("fallback elaborate", () => {
  it("produces a valid result for every action", () => {
    for (const action of ideationActionIds) {
      const result = buildFallbackIdeationElaborate({
        action,
        idea: sampleIdea,
        draft: DEFAULT_BRAINSTORM_DRAFT,
        ideaVersion: 1,
      });
      expect(ideationActionResultSchema.safeParse(result).success).toBe(true);
      expect(result.source).toBe("fallback");
    }
  });
});

describe("apply suggestions", () => {
  it("fills empty fields without overwrite flag", () => {
    const result = buildFallbackIdeationElaborate({
      action: "clarify",
      idea: sampleIdea,
      draft: DEFAULT_BRAINSTORM_DRAFT,
      ideaVersion: 1,
    });
    const applied = applyIdeationSuggestions({
      draft: DEFAULT_BRAINSTORM_DRAFT,
      result,
      acceptedFields: ["problem", "solution", "users"],
      overwriteConfirmed: false,
    });
    expect(applied.appliedFields.length).toBeGreaterThan(0);
    expect(applied.nextDraft.problem.length).toBeGreaterThan(0);
  });

  it("does not silently overwrite existing fields", () => {
    const draft = {
      ...DEFAULT_BRAINSTORM_DRAFT,
      problem: "Existing problem text that must be protected.",
    };
    const result = ideationActionResultSchema.parse({
      id: createResultId(),
      ideaId: sampleIdea.slug,
      ideaVersion: 1,
      action: "clarify",
      title: "Make the idea clearer",
      summary: "Proposed a different problem statement on purpose.",
      sections: [{ id: "s", title: "S", content: "Content long enough." }],
      suggestions: [
        {
          targetField: "problem",
          proposedValue: "A brand new proposed problem that differs.",
        },
      ],
      status: "generated",
      createdAt: new Date().toISOString(),
    });
    const applied = applyIdeationSuggestions({
      draft,
      result,
      acceptedFields: ["problem"],
      overwriteConfirmed: false,
    });
    expect(applied.nextDraft.problem).toBe(draft.problem);
    expect(applied.skippedConflicts.some((c) => c.field === "problem")).toBe(true);
  });

  it("challenge suggestions do not auto-apply without accept", () => {
    const draft = { ...DEFAULT_BRAINSTORM_DRAFT, challenge: "Keep me" };
    const result = buildFallbackIdeationElaborate({
      action: "challenge",
      idea: sampleIdea,
      draft,
      ideaVersion: 2,
    });
    expect(draft.challenge).toBe("Keep me");
    expect(result.status).toBe("generated");
  });
});

describe("history", () => {
  it("parses valid history and rejects invalid payloads", () => {
    const history = emptyIdeaHistory("sample-idea");
    expect(history.storageVersion).toBe(HISTORY_STORAGE_VERSION);
    expect(parseIdeaHistory(history)?.ideaId).toBe("sample-idea");
    expect(parseIdeaHistory({ storageVersion: 99 })).toBeNull();
  });

  it("builds a new version when suggestions are accepted", () => {
    const version = buildAcceptedVersion({
      ideaId: "sample-idea",
      nextDraft: { ...DEFAULT_BRAINSTORM_DRAFT, mvp: "Tiny MVP" },
      previousVersion: 1,
      origin: "mvp",
      sourceResultId: "res_1",
      changesSummary: "Accepted mvp",
    });
    expect(version.version).toBe(2);
    expect(version.origin).toBe("mvp");
    expect((version.snapshot as { mvp: string }).mvp).toBe("Tiny MVP");
  });
});

describe("skill import", () => {
  it("accepts a valid payload", () => {
    const parsed = parseSkillIdeaImport({
      version: 1,
      source: "intuition-ideation-skill",
      title: "GraphLens",
      summary: "Help users discover trusted attestations in a niche.",
      problem: "Discovery is hard",
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      const draft = skillImportToDraft(parsed.data);
      expect(draft.problem).toContain("Discovery");
    }
  });

  it("rejects unknown source or version", () => {
    expect(
      parseSkillIdeaImport({
        version: 1,
        source: "other-skill",
        title: "X",
        summary: "Long enough summary text",
      }).ok,
    ).toBe(false);
    expect(
      parseSkillIdeaImport({
        version: 2,
        source: "intuition-ideation-skill",
        title: "X",
        summary: "Long enough summary text",
      }).ok,
    ).toBe(false);
  });
});

describe("publication compatibility", () => {
  it("keeps the core triple shape after elaboration helpers", () => {
    const draft = {
      ...DEFAULT_BRAINSTORM_DRAFT,
      problem: "Concrete problem statement for publishers and builders alike.",
      solution: "A focused product that uses attestations and stakeable signal.",
      users: "DeFi researchers in one Discord",
      intuitionFit: "Needs shared graph discovery and optional staking.",
      mvp: "Feed + attest",
    };
    const plan = buildPublishPlan(sampleIdea, draft);
    expect(plan.coreTriple).toEqual([
      sampleIdea.title,
      "top project ideas for",
      "Intuition",
    ]);
  });
});
