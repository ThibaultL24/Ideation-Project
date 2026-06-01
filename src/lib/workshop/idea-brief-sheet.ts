// src/lib/workshop/idea-brief-sheet.ts
import type { IdeaBrief } from "./idea-brief";

export interface IdeaBriefSheetMeta {
  sessionId?: string;
  researchHeadline?: string;
  rawIntent?: string;
  finalizedAt?: string;
}

function escapeYaml(value: string): string {
  return value.replaceAll('"', '\\"').replaceAll("\n", " ");
}

export function slugifyBriefFilename(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "idea-brief";
}

export function buildIdeaBriefSheetMarkdown(
  brief: IdeaBrief,
  meta: IdeaBriefSheetMeta = {},
): string {
  const date = (meta.finalizedAt ?? new Date().toISOString()).slice(0, 10);
  const lines = [
    "---",
    `title: "${escapeYaml(brief.title)}"`,
    `tagline: "${escapeYaml(brief.oneLiner)}"`,
    `date: "${date}"`,
    `status: "draft"`,
    `source: "intuition-ideation-workshop"`,
    meta.sessionId ? `workshop_session: "${escapeYaml(meta.sessionId)}"` : "",
    meta.finalizedAt ? `finalized_at: "${meta.finalizedAt}"` : "",
    "---",
    "",
    `# ${brief.title}`,
    "",
    brief.oneLiner ? `> ${brief.oneLiner}` : "",
    "",
    meta.researchHeadline
      ? [`## Research headline`, "", meta.researchHeadline, ""].join("\n")
      : "",
    "## Problem",
    "",
    brief.problem || "_Not specified._",
    "",
    "## Solution",
    "",
    brief.solution || "_Not specified._",
    "",
    "## Target users",
    "",
    brief.targetUsers || "_Not specified._",
    "",
    "## Why now",
    "",
    brief.whyNow || "_Not specified._",
    "",
    "## Intuition angle",
    "",
    brief.intuitionAngle || "_Not specified._",
    "",
    "## Trust mechanism",
    "",
    brief.trustMechanism || "_Not specified._",
    "",
    "## MVP scope",
    "",
    brief.mvpScope || "_Not specified._",
    "",
    brief.openQuestions.length
      ? ["## Open questions", "", ...brief.openQuestions.map((q) => `- ${q}`)].join("\n")
      : "## Open questions\n\n_None yet._",
    "",
    meta.rawIntent
      ? ["## Original intent", "", meta.rawIntent, ""].join("\n")
      : "",
    "---",
    "",
    "_Intuition Ideation Workshop — idea brief sheet_",
  ];

  return lines.filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n");
}

export function ideaBriefSheetFilename(brief: IdeaBrief, finalizedAt?: string): string {
  const date = (finalizedAt ?? new Date().toISOString()).slice(0, 10);
  return `${date}-${slugifyBriefFilename(brief.title)}-brief.md`;
}

export function triggerMarkdownDownload(content: string, filename: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function validateBriefForFinalize(brief: IdeaBrief): string | null {
  if (!brief.title.trim()) return "Title is required.";
  if (!brief.oneLiner.trim()) return "One-liner is required.";
  if (!brief.problem.trim()) return "Problem is required.";
  if (!brief.solution.trim()) return "Solution is required.";
  if (brief.openQuestions.length < 1) return "Add at least one open question.";
  return null;
}
