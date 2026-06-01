// src/lib/workshop/publish-plan.ts
import { BOUNTY_PREDICATE_LABEL } from "@/lib/intuition/config";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import type { Idea } from "@/lib/ideas/schema";
import { buildPreparePrGuide, type PreparePrGuide } from "./prepare-pr-guide";
import { formatTripleLine } from "./triple-draft";
import type { WorkshopSession } from "./session";
import { normalizeSessionForPublish } from "./workshop-path";

export interface OnchainPublishStep {
  id: string;
  label: string;
  status: "exists" | "will_create" | "skip" | "preview";
  termId?: string;
  detail?: string;
}

/** Checklist sémantique avant publish (esprit decentrep : triples corrects, pas de pollution). */
export interface PublishGuide {
  headline: string;
  checks: string[];
  portalUrl: string;
  catalogAlreadyOnchain: boolean;
  publishBlockedReason?: string;
}

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
  onchainSteps: OnchainPublishStep[];
  publishGuide: PublishGuide;
  prGuide: PreparePrGuide;
  readiness: {
    githubReady: boolean;
    onchainReady: boolean;
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
  const archetype = draft?.archetypeSummary?.trim() || brief?.solution?.slice(0, 120) || "";

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
    object: "Intuition",
  };

  const onchainSteps: OnchainPublishStep[] = [];
  const subjectOc = draft?.coreTriple.onchain;
  const coreAlreadyOnchain = Boolean(
    draft?.graphSummary?.some((g) =>
      g.toLowerCase().includes("core triple") && g.toLowerCase().includes("exist"),
    ),
  );
  const catalogAlreadyOnchain =
    coreAlreadyOnchain || Boolean(subjectOc?.subjectStatus === "exists" && coreAlreadyOnchain);

  if (subjectOc?.subjectTermId && subjectOc.subjectStatus === "exists") {
    onchainSteps.push({
      id: "subject-atom",
      label: `Idea atom: ${core.subject}`,
      status: "skip",
      termId: subjectOc.subjectTermId,
      detail: "Already on graph — reuse",
    });
  } else if (subjectOc?.subjectTermId) {
    onchainSteps.push({
      id: "subject-atom",
      label: `Idea atom: ${core.subject}`,
      status: "will_create",
      termId: subjectOc.subjectTermId,
      detail: "Create atom (IPFS + MultiVault)",
    });
  } else {
    onchainSteps.push({
      id: "subject-atom",
      label: `Idea atom: ${core.subject}`,
      status: "will_create",
      detail: "New atom to create",
    });
  }

  if (subjectOc?.predicateTermId) {
    onchainSteps.push({
      id: "predicate-atom",
      label: `Predicate: ${core.predicate}`,
      status: "skip",
      termId: subjectOc.predicateTermId,
      detail: "Canonical predicate exists",
    });
  } else {
    onchainSteps.push({
      id: "predicate-atom",
      label: `Predicate: ${core.predicate}`,
      status: "will_create",
    });
  }

  if (subjectOc?.objectTermId) {
    onchainSteps.push({
      id: "object-atom",
      label: `Object: ${core.object}`,
      status: "skip",
      termId: subjectOc.objectTermId,
    });
  } else {
    onchainSteps.push({
      id: "object-atom",
      label: `Object: ${core.object}`,
      status: "will_create",
    });
  }

  if (coreAlreadyOnchain && subjectOc?.tripleTermId) {
    onchainSteps.push({
      id: "core-triple",
      label: "Core bounty triple",
      status: "skip",
      termId: subjectOc.tripleTermId,
      detail: "Already onchain (catalog 3A or existing) — do not recreate",
    });
  } else {
    onchainSteps.push({
      id: "core-triple",
      label: "Core bounty triple",
      status: "will_create",
      termId: subjectOc?.tripleTermId,
      detail: `${core.subject} → ${core.predicate} → ${core.object}`,
    });
  }

  for (const [i, t] of (draft?.supportTriples ?? []).entries()) {
    onchainSteps.push({
      id: `support-${i}`,
      label: formatTripleLine(t),
      status: "preview",
      detail: "Documented in the PR README — not published on-chain from the workshop",
    });
  }

  for (const [i, t] of (draft?.nestedTriples ?? []).entries()) {
    onchainSteps.push({
      id: `nested-${i}`,
      label: formatTripleLine(t),
      status: "preview",
      detail: "Nested / provenance — manual publication if needed",
    });
  }

  const prGuide = buildPreparePrGuide({
    ideaTitle: idea.title,
    coreSubject: core.subject,
    tagline: idea.tagline,
    githubPath,
    workshopPath: session.path,
    catalogAlreadyOnchain,
  });

  const publishChecks = prGuide.checklist;

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
    "## Product model (cards)",
    "",
    archetype || "_No card path recorded._",
    "",
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
    `## Workshop path\n${archetype}`,
    `## Core triple\n\`${core.subject}\` / \`${core.predicate}\` / \`${core.object}\``,
    supportTriples.length
      ? `## Support triples (preview)\n${supportTriples.map(([s, p, o]) => `- ${s} → ${p} → ${o}`).join("\n")}`
      : "",
  ].join("\n\n");

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
    onchainSteps,
    publishGuide: {
      headline: prGuide.headline,
      checks: publishChecks,
      portalUrl: "https://testnet.portal.intuition.systems/explore/home",
      catalogAlreadyOnchain,
      publishBlockedReason: undefined,
    },
    prGuide,
    readiness: {
      githubReady: Boolean(draft) && warnings.length <= 4,
      onchainReady: false,
      warnings,
    },
    fallbackCommands: [
      `gh pr create --repo intuition-box/ideas --title "Idea: ${idea.title}"`,
      `# Triples documented in README — no on-chain publish from workshop`,
    ],
  };
}
