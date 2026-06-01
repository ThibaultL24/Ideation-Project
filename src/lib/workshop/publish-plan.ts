// src/lib/workshop/publish-plan.ts
import { BOUNTY_PREDICATE_LABEL } from "@/lib/intuition/config";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import type { Idea } from "@/lib/ideas/schema";
import { isOnchainPublishConfigured } from "./decent-rep";
import { formatTripleLine } from "./triple-draft";
import type { WorkshopSession } from "./session";

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
  session: WorkshopSession,
): WorkshopPublishPlan {
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

  if (!brief?.problem?.trim()) {
    warnings.push("Complete deep research (idea brief) before publishing.");
  }
  if (!session.deepResearch?.headline) {
    warnings.push("Re-run analysis at /workshop/research if the brief is incomplete.");
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

  const onchainConfigured = isOnchainPublishConfigured();
  const supportCap = 3;

  for (const [i, t] of (draft?.supportTriples ?? []).entries()) {
    const willPublish = onchainConfigured && i < supportCap;
    onchainSteps.push({
      id: `support-${i}`,
      label: formatTripleLine(t),
      status: willPublish ? "will_create" : "preview",
      detail: willPublish
        ? `Support claim ${i + 1} (batch)`
        : i >= supportCap
          ? "Beyond batch limit — document only"
          : "Enable INTUITION_PRIVATE_KEY to publish",
    });
  }

  for (const [i, t] of (draft?.nestedTriples ?? []).entries()) {
    onchainSteps.push({
      id: `nested-${i}`,
      label: formatTripleLine(t),
      status: "preview",
      detail: "Provenance — off-chain in this flow",
    });
  }

  const publishChecks = [
    "One atom = one thing (short label, not « X and Y »).",
    `Core triple: [${core.subject}] → [${BOUNTY_PREDICATE_LABEL}] → [Intuition].`,
    "Stable predicates, nameable objects (like the existing graph).",
    onchainConfigured
      ? `Publish core + up to ${supportCap} support triples on testnet, then optionally open a GitHub PR.`
      : "Set INTUITION_PRIVATE_KEY in .env to publish on-chain from this screen.",
  ];
  if (catalogAlreadyOnchain) {
    publishChecks.push(
      "Catalog idea already migrated (3A): publishing will only create what is missing.",
    );
  }

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
    "## Original intent",
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
      headline: "Decentralized reputation on Intuition",
      checks: publishChecks,
      portalUrl: "https://testnet.portal.intuition.systems/explore/home",
      catalogAlreadyOnchain,
      publishBlockedReason: onchainConfigured
        ? undefined
        : "INTUITION_PRIVATE_KEY not configured — on-chain publish unavailable",
    },
    readiness: {
      githubReady: Boolean(draft) && warnings.length <= 4,
      onchainReady: Boolean(draft) && onchainConfigured && warnings.length <= 5,
      warnings,
    },
    fallbackCommands: [
      `# Publish atoms + triples: POST /api/workshop/prepare/onchain`,
      `gh pr create --repo intuition-box/ideas --title "Idea: ${idea.title}"`,
    ],
  };
}
