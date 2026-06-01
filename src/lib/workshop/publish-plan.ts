// src/lib/workshop/publish-plan.ts
import {
  BOUNTY_PREDICATE_LABEL,
  INTUITION_PROTOCOL_OBJECT_LABEL,
} from "@/lib/intuition/config";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import type { Idea } from "@/lib/ideas/schema";
import { buildPreparePrGuide, type PreparePrGuide } from "./prepare-pr-guide";
import type { WorkshopSession } from "./session";
import { normalizeSessionForPublish } from "./workshop-path";

export interface WorkshopPublishPlan {
  githubPath: string;
  branchName: string;
  prTitle: string;
  prBody: string;
  markdown: string;
  atom: {
    label: string;
    description: string;
    urlHint: string;
  };
  coreTriple: [string, string, string];
  supportTriples: Array<[string, string, string]>;
  nestedTriples: Array<[string, string, string]>;
  prGuide: PreparePrGuide;
  readiness: {
    githubReady: boolean;
    warnings: string[];
  };
  fallbackCommands: string[];
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function slugForPath(idea: Idea): string {
  return idea.slug.replace(/[^a-z0-9-]/gi, "-").slice(0, 60);
}

export function buildWorkshopPublishPlan(
  idea: Idea,
  draft: EnrichedTripleDraft | null | undefined,
  sessionInput: WorkshopSession,
): WorkshopPublishPlan {
  const session = normalizeSessionForPublish(sessionInput);
  const date = todayIsoDate();
  const pathSlug = slugForPath(idea);
  const githubPath = `ideas/${date}-${pathSlug}/README.md`;
  const branchName = `idea/${pathSlug}`;
  const warnings: string[] = [...(draft?.linterWarnings ?? [])];

  const brief = session.ideaBrief;
  const refinedPitch =
    draft?.refinedPitch?.trim() ||
    brief?.oneLiner ||
    session.rawIntent;

  if (session.path === "precise") {
    if (!session.deepResearch?.headline) {
      warnings.push(
        "Fast path: README uses your intent as draft — enrich sections in the PR or run /workshop/research first.",
      );
    }
  } else if (!brief?.problem?.trim() && !session.selectedDirection) {
    warnings.push("Complete brainstorm and pick a direction, or finalize the idea brief on Research.");
  } else if (!session.deepResearch?.headline && session.path === "explore") {
    warnings.push(
      "Optional: run deep research to enrich the README — or push from the chosen brainstorm direction.",
    );
  }
  if (!draft) warnings.push("Generate Intuition triples on this screen (dedicated button).");
  if (refinedPitch.length < 40) warnings.push("Pitch is still short for a GitHub PR.");

  const supportTriples: Array<[string, string, string]> = (draft?.supportTriples ?? []).map(
    (t) => [t.subject, t.predicate, t.object],
  );
  const nestedTriples: Array<[string, string, string]> = (draft?.nestedTriples ?? []).map(
    (t) => [t.subject, t.predicate, t.object],
  );

  const core = draft?.coreTriple ?? {
    subject: idea.title,
    predicate: BOUNTY_PREDICATE_LABEL,
    object: INTUITION_PROTOCOL_OBJECT_LABEL,
  };

  const catalogAlreadyOnchain = Boolean(
    draft?.graphSummary?.some(
      (g) =>
        g.toLowerCase().includes("core triple") && g.toLowerCase().includes("exist"),
    ),
  );

  const prGuide = buildPreparePrGuide({
    ideaTitle: idea.title,
    coreSubject: core.subject,
    tagline: idea.tagline,
    githubPath,
    workshopPath: session.path,
    catalogAlreadyOnchain,
  });

  const markdown = [
    "---",
    `title: "${idea.title.replaceAll('"', '\\"')}"`,
    `tagline: "${idea.tagline.replaceAll('"', '\\"')}"`,
    `category: "${idea.category.replaceAll('"', '\\"')}"`,
    `canonicalId: "${idea.canonicalId}"`,
    `status: "proposed"`,
    `source: "intuition-ideation-workshop"`,
    "---",
    "",
    `# ${idea.title}`,
    "",
    idea.tagline,
    "",
    "## Refined pitch",
    "",
    refinedPitch,
    "",
    brief
      ? [
          "## Problem",
          "",
          brief.problem,
          "",
          "## Solution",
          "",
          brief.solution,
          "",
          "## Target users",
          "",
          brief.targetUsers,
          "",
          "## Why now",
          "",
          brief.whyNow,
          "",
          "## Intuition angle",
          "",
          brief.intuitionAngle,
          "",
          "## Trust mechanism",
          "",
          brief.trustMechanism || "_Not specified._",
          "",
          "## MVP",
          "",
          brief.mvpScope,
          "",
          brief.openQuestions.length
            ? `## Open questions\n\n${brief.openQuestions.map((q) => `- ${q}`).join("\n")}\n`
            : "",
          session.deepResearch?.diagnostic.summary
            ? [
                "## Research diagnostic",
                "",
                session.deepResearch.diagnostic.summary,
                "",
                "**Strengths:**",
                session.deepResearch.diagnostic.strengths.map((s) => `- ${s}`).join("\n"),
                "",
                "**Weaknesses:**",
                session.deepResearch.diagnostic.weaknesses.map((w) => `- ${w}`).join("\n"),
                "",
              ].join("\n")
            : "",
        ].join("\n")
      : "",
    "## Intuition integration",
    "",
    draft?.refinedPitch
      ? refinedPitch
      : `Core triple: \`${core.subject}\` - \`${core.predicate}\` - \`${core.object}\``,
    "",
    "## Core triple",
    "",
    `\`${core.subject}\` - \`${core.predicate}\` - \`${core.object}\``,
    "",
    supportTriples.length
      ? `## Support triples (suggested)\n\n${supportTriples
          .map(([s, p, o]) => `- \`${s}\` - \`${p}\` - \`${o}\``)
          .join("\n")}\n`
      : "",
    nestedTriples.length
      ? `## Nested triples (provenance)\n\n${nestedTriples
          .map(([s, p, o]) => `- \`${s}\` - \`${p}\` - \`${o}\``)
          .join("\n")}\n`
      : "",
    "## Original exploration",
    "",
    session.explorationPrompt?.trim() || session.rawIntent,
    "",
    session.selectedDirection
      ? [
          "## Chosen brainstorm direction",
          "",
          `**${session.selectedDirection.title}** — ${session.selectedDirection.tagline}`,
          "",
          session.selectedDirection.problemHook,
          "",
        ].join("\n")
      : "",
    "## Refined intent (workshop)",
    "",
    session.rawIntent,
  ]
    .filter(Boolean)
    .join("\n");

  const prBody = [
    `## Summary\n${idea.tagline}`,
    brief?.intuitionAngle
      ? `## Intuition angle\n${brief.intuitionAngle}`
      : "",
    `## Core triple\n\`${core.subject}\` / \`${core.predicate}\` / \`${core.object}\``,
    supportTriples.length
      ? `## Support triples (preview)\n${supportTriples.map(([s, p, o]) => `- ${s} → ${p} → ${o}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    githubPath,
    branchName,
    prTitle: `Idea: ${idea.title}`,
    prBody,
    markdown,
    atom: {
      label: core.subject,
      description: idea.tagline,
      urlHint: `https://github.com/intuition-box/ideas/blob/<COMMIT_SHA>/${githubPath}`,
    },
    coreTriple: [core.subject, core.predicate, core.object],
    supportTriples,
    nestedTriples,
    prGuide,
    readiness: {
      githubReady: Boolean(draft) && warnings.length <= 4,
      warnings,
    },
    fallbackCommands: [
      `gh pr create --repo intuition-box/ideas --title "Idea: ${idea.title}"`,
      "# Triples documented in README — open PR from the workshop Prepare step",
    ],
  };
}
