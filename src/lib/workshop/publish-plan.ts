// src/lib/workshop/publish-plan.ts
import { BOUNTY_PREDICATE_LABEL } from "@/lib/intuition/config";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import type { Idea } from "@/lib/ideas/schema";
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
    session.refinementSummary ||
    session.rawIntent;
  const archetype =
    draft?.archetypeSummary?.trim() || session.picks.map((p) => p.title).join(" → ");

  if (!brief?.problem?.trim()) warnings.push("Complète le brainstorm (fiche idée) avant de publier.");
  if (!draft) warnings.push("Génère les triples Intuition sur cet écran (bouton dédié).");
  if (refinedPitch.length < 40) warnings.push("Pitch encore court pour une PR GitHub.");

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
      g.toLowerCase().includes("triple cœur existe"),
    ),
  );
  const catalogAlreadyOnchain =
    coreAlreadyOnchain || Boolean(subjectOc?.subjectStatus === "exists" && coreAlreadyOnchain);

  if (subjectOc?.subjectTermId && subjectOc.subjectStatus === "exists") {
    onchainSteps.push({
      id: "subject-atom",
      label: `Atom idée : ${core.subject}`,
      status: "skip",
      termId: subjectOc.subjectTermId,
      detail: "Déjà sur le graphe — réutilisation",
    });
  } else if (subjectOc?.subjectTermId) {
    onchainSteps.push({
      id: "subject-atom",
      label: `Atom idée : ${core.subject}`,
      status: "will_create",
      termId: subjectOc.subjectTermId,
      detail: "Création atom (IPFS + MultiVault)",
    });
  } else {
    onchainSteps.push({
      id: "subject-atom",
      label: `Atom idée : ${core.subject}`,
      status: "will_create",
      detail: "Nouvel atom à créer",
    });
  }

  if (subjectOc?.predicateTermId) {
    onchainSteps.push({
      id: "predicate-atom",
      label: `Prédicat : ${core.predicate}`,
      status: "skip",
      termId: subjectOc.predicateTermId,
      detail: "Prédicat canonique existant",
    });
  } else {
    onchainSteps.push({
      id: "predicate-atom",
      label: `Prédicat : ${core.predicate}`,
      status: "will_create",
    });
  }

  if (subjectOc?.objectTermId) {
    onchainSteps.push({
      id: "object-atom",
      label: `Objet : ${core.object}`,
      status: "skip",
      termId: subjectOc.objectTermId,
    });
  } else {
    onchainSteps.push({
      id: "object-atom",
      label: `Objet : ${core.object}`,
      status: "will_create",
    });
  }

  if (coreAlreadyOnchain && subjectOc?.tripleTermId) {
    onchainSteps.push({
      id: "core-triple",
      label: "Triple cœur bounty",
      status: "skip",
      termId: subjectOc.tripleTermId,
      detail: "Déjà onchain (catalogue 3A ou existant) — rien à recréer",
    });
  } else {
    onchainSteps.push({
      id: "core-triple",
      label: "Triple cœur bounty",
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
      detail: "Non publié automatiquement — valide d'abord sur le graphe",
    });
  }

  for (const [i, t] of (draft?.nestedTriples ?? []).entries()) {
    onchainSteps.push({
      id: `nested-${i}`,
      label: formatTripleLine(t),
      status: "preview",
      detail: "Nested / provenance — publication manuelle si besoin",
    });
  }

  const hasOnlySkips = onchainSteps
    .filter((s) => s.id.startsWith("core") || s.id.includes("atom"))
    .every((s) => s.status === "skip");

  const publishChecks = [
    "Un atom = une chose (label court, pas « X et Y »).",
    `Triple cœur : [${core.subject}] → [${BOUNTY_PREDICATE_LABEL}] → [Intuition].`,
    "Prédicats stables, objets nommables (comme sur le graphe existant).",
    "Triples de soutien et nested : preview seulement dans ce flux.",
  ];
  if (catalogAlreadyOnchain) {
    publishChecks.push(
      "Idée catalogue déjà migrée (3A) : la publication ne recréera que ce qui manque.",
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
          "## MVP",
          "",
          brief.mvpScope,
          "",
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
      headline: "Publication Intuition (assistant sémantique)",
      checks: publishChecks,
      portalUrl: "https://testnet.portal.intuition.systems/explore/home",
      catalogAlreadyOnchain,
      publishBlockedReason: hasOnlySkips
        ? "Tout est déjà onchain pour cette idée — vérifie le Portal."
        : undefined,
    },
    readiness: {
      githubReady: Boolean(draft) && warnings.length <= 3,
      onchainReady: Boolean(draft?.coreTriple) && !hasOnlySkips,
      warnings,
    },
    fallbackCommands: [
      `gh pr create --repo intuition-box/ideas --title "Idea: ${idea.title}"`,
      `# Puis publier onchain depuis Prepare (wallet serveur .env)`,
    ],
  };
}
