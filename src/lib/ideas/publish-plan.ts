import type { Idea } from "./schema";
import { BOUNTY_PREDICATE_LABEL } from "@/lib/intuition/config";

export type BrainstormArchetype =
  | "curated-list"
  | "reputation"
  | "social-attestation"
  | "risk-detection"
  | "prediction-signal"
  | "agent-memory";

export interface BrainstormDraft {
  archetype: BrainstormArchetype;
  problem: string;
  solution: string;
  users: string;
  intuitionFit: string;
  mvp: string;
  risks: string;
  challenge: string;
  supportTriples: string;
}

export interface PublishPlan {
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
  readiness: {
    githubReady: boolean;
    onchainReady: boolean;
    warnings: string[];
  };
  fallbackCommands: string[];
}

export const DEFAULT_BRAINSTORM_DRAFT: BrainstormDraft = {
  archetype: "reputation",
  problem: "",
  solution: "",
  users: "",
  intuitionFit: "",
  mvp: "",
  risks: "",
  challenge: "",
  supportTriples: "",
};

const ARCHETYPE_LABELS: Record<BrainstormArchetype, string> = {
  "curated-list": "Curated list",
  reputation: "Reputation system",
  "social-attestation": "Social attestations",
  "risk-detection": "Risk detection",
  "prediction-signal": "Prediction / signal market",
  "agent-memory": "Agent memory / data layer",
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function cleanLine(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function markdownBlock(title: string, body: string, fallback: string): string {
  const value = body.trim() || fallback;
  return `## ${title}\n\n${value}\n`;
}

function parseSupportTriples(raw: string, ideaTitle: string): Array<[string, string, string]> {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((line) => {
      const parts = line
        .split(/\s*(?:->|—|-{2,}|,)\s*/)
        .map((part) => part.trim())
        .filter(Boolean);
      if (parts.length >= 3) return [parts[0], parts[1], parts.slice(2).join(" ")] as [string, string, string];
      return [ideaTitle, "relates to", line] as [string, string, string];
    });
}

export function normalizeBrainstormDraft(input: Partial<BrainstormDraft> | null | undefined): BrainstormDraft {
  return {
    ...DEFAULT_BRAINSTORM_DRAFT,
    ...(input ?? {}),
  };
}

export function buildPublishPlan(idea: Idea, draftInput?: Partial<BrainstormDraft> | null): PublishPlan {
  const draft = normalizeBrainstormDraft(draftInput);
  const date = todayIsoDate();
  const githubPath = `ideas/${date}-${idea.slug}/README.md`;
  const branchName = `idea/${idea.slug}`;
  const warnings: string[] = [];

  if (cleanLine(draft.problem).length < 30) warnings.push("Problem statement is still thin.");
  if (cleanLine(draft.solution).length < 30) warnings.push("Solution journey needs more detail.");
  if (cleanLine(draft.intuitionFit).length < 30) warnings.push("Intuition integration should name atoms, triples, or signal.");
  if (cleanLine(draft.users).length < 15) warnings.push("Target users should be more specific.");

  const supportTriples = parseSupportTriples(draft.supportTriples, idea.title);

  const frontmatter = [
    "---",
    `title: "${idea.title.replaceAll('"', '\\"')}"`,
    `tagline: "${idea.tagline.replaceAll('"', '\\"')}"`,
    `category: "${idea.category.replaceAll('"', '\\"')}"`,
    `canonicalId: "${idea.canonicalId}"`,
    `status: "proposed"`,
    `archetype: "${ARCHETYPE_LABELS[draft.archetype]}"`,
    "source: \"intuition-ideation-dapp\"",
    "---",
  ].join("\n");

  // Frontmatter-free document: reused as the README body and the PR preview.
  const documentBody = [
    `# ${idea.title}`,
    "",
    idea.tagline,
    "",
    markdownBlock("Problem", draft.problem, idea.description),
    markdownBlock("Proposed Solution", draft.solution, "The dapp turns this catalog idea into a focused product workflow."),
    markdownBlock("Target Users", draft.users, "Early Intuition builders and community members evaluating new product ideas."),
    markdownBlock("Intuition Integration", draft.intuitionFit, `Create an idea atom and the core triple [${idea.title}] - [${BOUNTY_PREDICATE_LABEL}] - [Intuition].`),
    markdownBlock("MVP", draft.mvp, "Random idea picker, existing-state check, brainstorm canvas, GitHub PR preview, onchain publish action."),
    markdownBlock("Challenge Notes", draft.challenge, draft.risks || "Main risks should be validated before build."),
    "## Core Triple",
    "",
    `\`${idea.title}\` - \`${BOUNTY_PREDICATE_LABEL}\` - \`Intuition\``,
    "",
    supportTriples.length > 0
      ? `## Support Triple Suggestions\n\n${supportTriples
          .map(([s, p, o]) => `- \`${s}\` - \`${p}\` - \`${o}\``)
          .join("\n")}\n`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const markdown = `${frontmatter}\n\n${documentBody}`;

  const prBody = [
    `## Summary\n${idea.tagline}`,
    `## Intuition Integration\n${cleanLine(draft.intuitionFit) || `Core triple: [${idea.title}] - [${BOUNTY_PREDICATE_LABEL}] - [Intuition].`}`,
    "## Publish Plan",
    [
      `- GitHub path: \`${githubPath}\``,
      `- Atom label: \`${idea.title}\``,
      `- Core triple: \`${idea.title}\` / \`${BOUNTY_PREDICATE_LABEL}\` / \`Intuition\``,
    ].join("\n"),
    "---",
    "## Idea Preview",
    documentBody,
  ].join("\n\n");

  return {
    githubPath,
    branchName,
    prTitle: `Idea: ${idea.title}`,
    prBody,
    markdown,
    atom: {
      label: idea.title,
      description: idea.tagline,
      urlHint: `https://github.com/intuition-box/ideas/blob/<COMMIT_SHA>/${githubPath}`,
    },
    coreTriple: [idea.title, BOUNTY_PREDICATE_LABEL, "Intuition"],
    supportTriples,
    readiness: {
      githubReady: warnings.length <= 2,
      onchainReady: true,
      warnings,
    },
    fallbackCommands: [
      "gh repo fork intuition-box/ideas --clone",
      "cd ideas",
      `git checkout -b ${branchName}`,
      `mkdir -p ${githubPath.replace(/\/README\.md$/, "")}`,
      `# write the generated markdown to ${githubPath}`,
      `git add ${githubPath}`,
      `git commit -m "idea: ${idea.title.replaceAll('"', '\\"')}"`,
      `git push origin ${branchName}`,
      `gh pr create --repo intuition-box/ideas --title "${`Idea: ${idea.title}`.replaceAll('"', '\\"')}" --body-file pr-body.md`,
    ],
  };
}
