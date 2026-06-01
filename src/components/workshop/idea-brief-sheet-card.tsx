// src/components/workshop/idea-brief-sheet-card.tsx
"use client";

import { useState } from "react";
import { normalizeIdeaBrief, type IdeaBrief } from "@/lib/workshop/idea-brief";
import {
  buildIdeaBriefSheetMarkdown,
  ideaBriefSheetFilename,
  triggerMarkdownDownload,
  validateBriefForFinalize,
} from "@/lib/workshop/idea-brief-sheet";
import { RESEARCH_SECTIONS } from "@/lib/workshop/idea-research";

const BRIEF_FIELDS: Array<{ key: keyof IdeaBrief; label: string; rows: number }> = [
  { key: "title", label: "Title", rows: 1 },
  { key: "oneLiner", label: "One-liner", rows: 2 },
  { key: "problem", label: "Problem", rows: 3 },
  { key: "solution", label: "Solution", rows: 3 },
  { key: "targetUsers", label: "Target users", rows: 2 },
  { key: "whyNow", label: "Why now", rows: 2 },
  { key: "intuitionAngle", label: "Intuition angle", rows: 3 },
  { key: "trustMechanism", label: "Trust mechanism", rows: 3 },
  { key: "mvpScope", label: "MVP scope", rows: 2 },
];

interface IdeaBriefSheetCardProps {
  brief: IdeaBrief;
  finalizedAt: string | null;
  sessionId: string;
  rawIntent: string;
  researchHeadline?: string;
  onBriefChange: (brief: IdeaBrief) => void;
  onFinalized: (brief: IdeaBrief, finalizedAt: string) => void;
}

export function IdeaBriefSheetCard({
  brief,
  finalizedAt,
  sessionId,
  rawIntent,
  researchHeadline,
  onBriefChange,
  onFinalized,
}: IdeaBriefSheetCardProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  function updateField(key: keyof IdeaBrief, value: string) {
    onBriefChange({ ...brief, [key]: value });
  }

  function updateOpenQuestions(text: string) {
    onBriefChange({
      ...brief,
      openQuestions: text
        .split("\n")
        .map((q) => q.replace(/^[-*•]\s*/, "").trim())
        .filter(Boolean),
    });
  }

  function sheetMeta(at?: string) {
    return {
      sessionId,
      researchHeadline,
      rawIntent,
      finalizedAt: at,
    };
  }

  function handleSave() {
    setSaveError(null);
    const normalized = normalizeIdeaBrief(brief, brief.title, rawIntent);
    const validationError = validateBriefForFinalize(normalized);
    if (validationError) {
      setSaveError(validationError);
      return;
    }
    const at = new Date().toISOString();
    onFinalized(normalized, at);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  }

  function handleDownload() {
    const normalized = normalizeIdeaBrief(brief, brief.title, rawIntent);
    const at = finalizedAt ?? new Date().toISOString();
    const markdown = buildIdeaBriefSheetMarkdown(normalized, sheetMeta(at));
    triggerMarkdownDownload(markdown, ideaBriefSheetFilename(normalized, at));
  }

  const previewMarkdown = buildIdeaBriefSheetMarkdown(
    normalizeIdeaBrief(brief, brief.title, rawIntent),
    sheetMeta(finalizedAt ?? undefined),
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--accent)]/40 bg-[var(--card)] shadow-lg shadow-black/20">
      <div className="border-b border-[var(--border)] bg-gradient-to-r from-violet-950/40 to-[var(--card)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-black">
                5
              </span>
              {RESEARCH_SECTIONS[4]!.title}
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)] max-w-xl">
              Catalog-style idea sheet — edit, save to finalize, then download as Markdown
              before decentralized reputation or a GitHub PR.
            </p>
          </div>
          <div className="text-right text-[10px] uppercase tracking-wide">
            {finalizedAt ? (
              <span className="text-emerald-400/90">Saved</span>
            ) : (
              <span className="text-amber-400/90">Draft</span>
            )}
            {finalizedAt && (
              <p className="mt-0.5 font-normal normal-case text-[var(--muted)]">
                {new Date(finalizedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {BRIEF_FIELDS.map((f) => (
          <label key={f.key} className="block space-y-1">
            <span className="text-xs font-medium text-white/90">{f.label}</span>
            <textarea
              value={(brief[f.key] as string) || ""}
              onChange={(e) => updateField(f.key, e.target.value)}
              rows={f.rows}
              className="w-full rounded-lg border border-[var(--border)] bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </label>
        ))}
        <label className="block space-y-1">
          <span className="text-xs font-medium text-white/90">Open questions (one per line)</span>
          <textarea
            value={brief.openQuestions.join("\n")}
            onChange={(e) => updateOpenQuestions(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-[var(--border)] bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>

        {saveError && <p className="text-xs text-rose-400">{saveError}</p>}
        {savedFlash && (
          <p className="text-xs text-emerald-400/90">Sheet saved — you can download it now.</p>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
          >
            Save sheet
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!finalizedAt}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)] disabled:opacity-40"
          >
            Download (.md)
          </button>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="rounded-lg px-4 py-2 text-sm text-[var(--muted)] hover:text-white"
          >
            {showPreview ? "Hide preview" : "Preview sheet"}
          </button>
        </div>

        {!finalizedAt && (
          <p className="text-[10px] text-[var(--muted)]">
            Save the sheet to unlock download and continue to on-chain reputation.
          </p>
        )}

        {showPreview && (
          <pre className="max-h-72 overflow-auto rounded-lg border border-[var(--border)] bg-neutral-950 p-4 text-xs whitespace-pre-wrap text-[var(--muted)]">
            {previewMarkdown}
          </pre>
        )}
      </div>
    </section>
  );
}
