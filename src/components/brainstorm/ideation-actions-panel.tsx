// src/components/brainstorm/ideation-actions-panel.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Idea } from "@/lib/ideas/schema";
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import {
  actionIdToVersionOrigin,
  listIdeationActions,
  type DraftSuggestionField,
  type IdeationActionId,
  type IdeationActionResult,
} from "@/lib/ideas/ideation-actions";
import {
  applyIdeationSuggestions,
  listSuggestionConflicts,
} from "@/lib/ideas/apply-ideation-suggestions";
import {
  buildAcceptedVersion,
  createLocalIdeaHistoryRepository,
  ensureInitialVersion,
  type IdeaHistory,
} from "@/lib/ideas/idea-history";
import {
  parseSkillIdeaImportText,
  skillImportToDraft,
  type SkillIdeaImport,
} from "@/lib/ideas/skill-idea-import";
import { ideationActionStrings as s } from "@/lib/strings/ideation-actions";

interface IdeationActionsPanelProps {
  idea: Idea;
  draft: BrainstormDraft;
  onDraftChange: (draft: BrainstormDraft) => void;
  onContinuePublish: () => void;
}

type UiState = "idle" | "generating" | "generated" | "error" | "fallback";

const repo = createLocalIdeaHistoryRepository();

export function IdeationActionsPanel({
  idea,
  draft,
  onDraftChange,
  onContinuePublish,
}: IdeationActionsPanelProps) {
  const actions = useMemo(() => listIdeationActions(), []);
  const [history, setHistory] = useState<IdeaHistory | null>(null);
  const [selected, setSelected] = useState<IdeationActionId | null>(null);
  const [uiState, setUiState] = useState<UiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IdeationActionResult | null>(null);
  const [acceptedFields, setAcceptedFields] = useState<DraftSuggestionField[]>([]);
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<SkillIdeaImport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    const loaded = (await repo.loadIdeaHistory(idea.slug)) ?? null;
    const ensured = ensureInitialVersion({
      ideaId: idea.slug,
      draft,
      history: loaded!,
    });
    if (ensured.version) {
      await repo.saveVersion(ensured.version);
    }
    setHistory(ensured.history);
  }, [idea.slug, draft]);

  useEffect(() => {
    void loadHistory();
    // Only re-bootstrap history when the idea changes — not on every draft keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [idea.slug]);

  const draftReadyForChallenge =
    draft.problem.trim().length >= 20 || draft.solution.trim().length >= 20;

  async function runAction(action: IdeationActionId) {
    if (uiState === "generating") return;
    if (action === "challenge" && !draftReadyForChallenge) {
      setError(s.requiresDraft);
      setUiState("error");
      setSelected(action);
      return;
    }

    setSelected(action);
    setUiState("generating");
    setError(null);
    setResult(null);
    setAcceptedFields([]);
    setOverwriteConfirmed(false);

    try {
      const res = await fetch("/api/brainstorm/elaborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          idea,
          draft,
          ideaVersion: history?.currentVersion ?? 1,
          intent: idea.tagline || idea.description,
        }),
      });
      const data = (await res.json()) as {
        result?: IdeationActionResult;
        source?: string;
        assistError?: string | null;
        error?: string;
      };
      if (!res.ok || !data.result) {
        throw new Error(data.error ?? "Generation failed");
      }

      await repo.saveResult(data.result);
      setResult(data.result);
      setAcceptedFields(data.result.suggestions.map((x) => x.targetField));
      setUiState(data.source === "fallback" ? "fallback" : "generated");
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setUiState("error");
    }
  }

  async function rejectResult() {
    if (!result) return;
    await repo.markResultStatus(result.id, "rejected");
    setResult({ ...result, status: "rejected" });
    setUiState("idle");
    await loadHistory();
  }

  async function applySelected(mode: "empty-only" | "overwrite") {
    if (!result) return;
    const conflicts = listSuggestionConflicts(draft, result);
    const overwrite = mode === "overwrite";
    if (conflicts.length > 0 && !overwrite && !overwriteConfirmed) {
      setOverwriteConfirmed(false);
      setError(null);
      // Show conflicts by setting flag UI — user must pick overwrite.
      setOverwriteConfirmed(false);
    }

    const applied = applyIdeationSuggestions({
      draft,
      result,
      acceptedFields,
      overwriteConfirmed: overwrite,
    });

    if (applied.unchanged && applied.skippedConflicts.length > 0 && !overwrite) {
      setOverwriteConfirmed(true);
      return;
    }

    if (applied.unchanged) {
      await repo.markResultStatus(result.id, "accepted");
      setResult({ ...result, status: "accepted" });
      setUiState("idle");
      await loadHistory();
      return;
    }

    onDraftChange(applied.nextDraft);
    localStorage.setItem(
      `brainstorm-draft:${idea.slug}`,
      JSON.stringify(applied.nextDraft),
    );

    const version = buildAcceptedVersion({
      ideaId: idea.slug,
      nextDraft: applied.nextDraft,
      previousVersion: history?.currentVersion ?? 1,
      origin: actionIdToVersionOrigin(result.action),
      sourceResultId: result.id,
      changesSummary: `Accepted ${result.action}: ${applied.appliedFields.join(", ")}`,
    });
    await repo.saveVersion(version);
    await repo.markResultStatus(result.id, "accepted");
    setResult({ ...result, status: "accepted" });
    setOverwriteConfirmed(false);
    setUiState("idle");
    await loadHistory();
  }

  function previewImport() {
    const parsed = parseSkillIdeaImportText(importText);
    if (!parsed.ok) {
      setImportPreview(null);
      setImportError(parsed.error);
      return;
    }
    setImportError(null);
    setImportPreview(parsed.data);
  }

  function confirmImport() {
    if (!importPreview) return;
    const next = skillImportToDraft(importPreview);
    onDraftChange(next);
    localStorage.setItem(`brainstorm-draft:${idea.slug}`, JSON.stringify(next));
    setImportPreview(null);
    setImportText("");
  }

  const conflicts =
    result && overwriteConfirmed ? listSuggestionConflicts(draft, result) : [];

  return (
    <section className="neon-card space-y-5 rounded-2xl p-5 md:p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{s.sectionTitle}</h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{s.sectionLead}</p>
        <div className="mt-3 rounded-lg border border-[rgba(78,234,213,0.2)] bg-[rgba(78,234,213,0.04)] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cyan)]">
            {s.howToUseTitle}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{s.howToUse}</p>
        </div>
        {history ? (
          <p className="mt-2 text-xs text-[var(--cyan)]/80">
            {s.currentVersion}: v{history.currentVersion || 1}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const isSelected = selected === action.id;
          const isGenerating = uiState === "generating" && isSelected;
          const disabled = uiState === "generating";
          return (
            <button
              key={action.id}
              type="button"
              disabled={disabled}
              onClick={() => void runAction(action.id)}
              className={`neon-card rounded-xl p-4 text-left disabled:opacity-50 ${
                isSelected ? "neon-card-active" : ""
              } ${isGenerating ? "neon-generating" : ""}`}
            >
              <span className="block text-sm font-semibold">{action.label}</span>
              <span className="mt-1 block text-xs text-[var(--muted)]">
                {action.description}
              </span>
              <span className="mt-2 block text-[11px] text-[var(--cyan-bright)]">
                → {action.outcome}
              </span>
              {action.id === "challenge" ? (
                <span className="mt-2 block text-[10px] uppercase tracking-wide text-amber-200/80">
                  {s.optionalChallenge}
                </span>
              ) : null}
              <span className="mt-3 inline-block text-xs font-medium text-[var(--cyan)]">
                {isGenerating ? s.regenerating : s.generate}
              </span>
            </button>
          );
        })}
      </div>

      {uiState === "generating" ? (
        <p className="text-sm text-[var(--muted)]">{s.regeneratingHint}</p>
      ) : null}

      {error ? <p className="text-sm text-amber-200">{error}</p> : null}

      {result && (uiState === "generated" || uiState === "fallback") ? (
        <div className="neon-card neon-card-active space-y-4 rounded-xl p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{result.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{result.summary}</p>
            </div>
            <span className="text-[10px] uppercase tracking-wide text-[var(--cyan)]">
              {uiState === "fallback" ? s.fallbackUsed : s.openaiUsed}
            </span>
          </div>

          <div className="space-y-3">
            {result.sections.map((section) => (
              <div key={section.id}>
                <h4 className="neon-kicker text-[10px] font-semibold uppercase">
                  {section.title}
                </h4>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--foreground)]">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {result.suggestions.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">{s.noSuggestions}</p>
          ) : (
            <ul className="space-y-2">
              {result.suggestions.map((suggestion) => {
                const checked = acceptedFields.includes(suggestion.targetField);
                return (
                  <li
                    key={`${suggestion.targetField}-${suggestion.proposedValue.slice(0, 24)}`}
                    className="neon-card rounded-md p-3 text-sm"
                  >
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setAcceptedFields((prev) =>
                            e.target.checked
                              ? [...new Set([...prev, suggestion.targetField])]
                              : prev.filter((f) => f !== suggestion.targetField),
                          );
                        }}
                      />
                      <span>
                        <span className="font-medium">{suggestion.targetField}</span>
                        {suggestion.reason ? (
                          <span className="block text-xs text-[var(--muted)]">
                            {suggestion.reason}
                          </span>
                        ) : null}
                        <span className="mt-1 block whitespace-pre-wrap text-xs">
                          {suggestion.proposedValue}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          {overwriteConfirmed && conflicts.length > 0 ? (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
              <p className="text-sm font-medium text-amber-100">{s.conflictTitle}</p>
              <p className="mt-1 text-xs text-amber-100/80">{s.conflictLead}</p>
              <ul className="mt-3 space-y-2 text-xs">
                {conflicts.map((c) => (
                  <li key={c.field}>
                    <p className="font-semibold">{c.field}</p>
                    <p className="text-[var(--muted)]">
                      {s.currentValue}: {c.currentValue.slice(0, 180)}
                    </p>
                    <p>
                      {s.proposedValue}: {c.proposedValue.slice(0, 180)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {result.suggestions.length > 0 ? (
              <>
                <button
                  type="button"
                  className="neon-btn rounded-lg px-3 py-2 text-sm font-medium"
                  onClick={() => void applySelected("empty-only")}
                >
                  {overwriteConfirmed ? s.applyEmptyOnly : s.acceptSelected}
                </button>
                {overwriteConfirmed ? (
                  <button
                    type="button"
                    className="rounded-lg border border-amber-400/50 px-3 py-2 text-sm text-amber-50"
                    onClick={() => void applySelected("overwrite")}
                  >
                    {s.confirmOverwrite}
                  </button>
                ) : null}
              </>
            ) : null}
            <button
              type="button"
              className="neon-btn-ghost rounded-lg px-3 py-2 text-sm"
              onClick={() => void rejectResult()}
            >
              {s.rejectResult}
            </button>
            <button
              type="button"
              className="neon-btn-ghost rounded-lg px-3 py-2 text-sm"
              onClick={() => selected && void runAction(selected)}
            >
              {s.regenerate}
            </button>
            <button
              type="button"
              className="neon-btn-ghost rounded-lg px-3 py-2 text-sm"
              onClick={() => {
                setResult(null);
                setSelected(null);
                setUiState("idle");
              }}
            >
              {s.chooseAnother}
            </button>
            <button
              type="button"
              className="neon-btn rounded-lg px-3 py-2 text-sm font-medium"
              onClick={onContinuePublish}
            >
              {s.continuePublish} →
            </button>
          </div>
        </div>
      ) : null}

      <div className="neon-panel rounded-xl p-4">
        <h3 className="text-sm font-semibold">{s.historyTitle}</h3>
        {!history || history.versions.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--muted)]">{s.historyEmpty}</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {history.versions.slice(0, 8).map((version) => (
              <li
                key={version.id}
                className="neon-card rounded-md px-3 py-2 text-xs"
              >
                <span className="font-medium text-[var(--cyan-bright)]">
                  v{version.version} · {version.origin}
                </span>
                <span className="mt-0.5 block text-[var(--muted)]">
                  {version.changesSummary}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <details className="rounded-xl border border-dashed border-[rgba(78,234,213,0.28)] bg-[rgba(78,234,213,0.03)] p-4">
        <summary className="cursor-pointer text-sm font-semibold">{s.importTitle}</summary>
        <p className="mt-2 text-xs text-[var(--muted)]">{s.importLead}</p>
        <textarea
          className="neon-input mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 font-mono text-xs"
          rows={4}
          placeholder={s.importPlaceholder}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
        {importError ? (
          <p className="mt-2 text-xs text-amber-200">
            {s.importError}: {importError}
          </p>
        ) : null}
        {importPreview ? (
          <div className="neon-card mt-3 rounded-md p-3 text-xs">
            <p className="font-medium">{importPreview.title}</p>
            <p className="mt-1 text-[var(--muted)]">{importPreview.summary}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="neon-btn rounded-md px-2 py-1 text-xs font-medium"
                onClick={confirmImport}
              >
                {s.importConfirm}
              </button>
              <button
                type="button"
                className="neon-btn-ghost rounded-md px-2 py-1 text-xs"
                onClick={() => setImportPreview(null)}
              >
                {s.importCancel}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="neon-btn-ghost mt-2 rounded-md px-3 py-1.5 text-xs"
            onClick={previewImport}
          >
            {s.importPreview}
          </button>
        )}
      </details>
    </section>
  );
}
