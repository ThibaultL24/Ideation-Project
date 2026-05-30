// src/components/scamper/scamper-workspace.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  buildScamperSynthesis,
  completedCount,
  defaultScamperDraft,
  getScamperSteps,
  isStepComplete,
  mergeSynthesisIntoBrainstormDraft,
  nextLetter,
  prevLetter,
  SCAMPER_LETTERS,
  scamperStorageKey,
  type ScamperDraft,
  type ScamperLetter,
  type ScamperWorkItem,
} from "@/lib/ideas/scamper";

interface ScamperWorkspaceProps {
  workItem: ScamperWorkItem;
}

export function ScamperWorkspace({ workItem }: ScamperWorkspaceProps) {
  const steps = useMemo(
    () => getScamperSteps(workItem.mode),
    [workItem.mode],
  );
  const [draft, setDraft] = useState<ScamperDraft>(defaultScamperDraft);
  const [activeStep, setActiveStep] = useState<ScamperLetter>("S");
  const [saved, setSaved] = useState(false);
  const [pushedToBrainstorm, setPushedToBrainstorm] = useState(false);

  const current = steps.find((s) => s.letter === activeStep)!;
  const progress = completedCount(draft.answers);
  const autoSynthesis = useMemo(
    () => buildScamperSynthesis(workItem.title, draft.answers),
    [workItem.title, draft.answers],
  );

  const brainstormHref =
    workItem.mode === "free"
      ? `/brainstorm/libre/${workItem.slug}`
      : `/brainstorm/${workItem.slug}`;

  useEffect(() => {
    const raw = localStorage.getItem(scamperStorageKey(workItem.slug));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ScamperDraft;
      if (parsed.version === 1) setDraft(parsed);
    } catch {
      /* ignore */
    }
  }, [workItem.slug]);

  useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      synthesis: prev.synthesis.trim() ? prev.synthesis : autoSynthesis,
    }));
  }, [autoSynthesis]);

  function updateAnswer(value: string) {
    setDraft((prev) => ({
      ...prev,
      answers: { ...prev.answers, [activeStep]: value },
    }));
    setSaved(false);
    setPushedToBrainstorm(false);
  }

  function saveDraft() {
    const synthesis =
      draft.synthesis.trim() ||
      buildScamperSynthesis(workItem.title, draft.answers);
    const completedSteps = SCAMPER_LETTERS.filter((l) =>
      isStepComplete(draft.answers, l),
    );
    const next: ScamperDraft = { ...draft, synthesis, completedSteps };
    localStorage.setItem(scamperStorageKey(workItem.slug), JSON.stringify(next));
    setDraft(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  function pushToBrainstorm() {
    const synthesis =
      draft.synthesis.trim() ||
      buildScamperSynthesis(workItem.title, draft.answers);
    mergeSynthesisIntoBrainstormDraft(workItem.slug, synthesis);
    setPushedToBrainstorm(true);
    window.setTimeout(() => setPushedToBrainstorm(false), 2500);
  }

  function goNext() {
    const n = nextLetter(activeStep);
    if (n) setActiveStep(n);
    else saveDraft();
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--accent)]">
              SCAMPER ·{" "}
              {workItem.mode === "free" ? "idée libre" : "divergence créative"}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{workItem.title}</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">{workItem.tagline}</p>
          </div>
          <div className="text-right text-sm text-[var(--muted)]">
            {progress}/7 étapes complétées
          </div>
        </div>
        <p className="mt-4 text-sm text-[var(--muted)]">
          {workItem.mode === "free"
            ? "Développez votre concept original — sans carte catalogue. Puis passez au Brainstorm pour le modéliser sur Intuition."
            : "Technique SCAMPER après les cartes — avant le workspace Brainstorm. Chaque lettre pose des questions orientées Intuition."}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {steps.map((step) => {
          const done = isStepComplete(draft.answers, step.letter);
          const active = step.letter === activeStep;
          return (
            <button
              key={step.letter}
              type="button"
              onClick={() => setActiveStep(step.letter)}
              className={`flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                  : done
                    ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-300"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-[var(--accent)]"
              }`}
              title={step.verb}
            >
              {step.letter}
            </button>
          );
        })}
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="rounded bg-[var(--accent)]/20 px-2 py-0.5 text-lg font-bold text-[var(--accent)]">
            {current.letter}
          </span>
          <h2 className="text-xl font-semibold">{current.verb}</h2>
          <span className="text-sm text-[var(--muted)]">— {current.title}</span>
        </div>
        <p className="mt-3 text-sm text-[var(--muted)]">{current.intro}</p>

        <ul className="mt-4 space-y-2">
          {current.prompts.map((prompt) => (
            <li key={prompt} className="flex gap-2 text-sm text-[var(--foreground)]">
              <span className="text-[var(--accent)]">→</span>
              {prompt}
            </li>
          ))}
        </ul>

        <p className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--muted)]">
          {current.intuitionHint}
        </p>

        <label className="mt-5 block">
          <span className="text-sm font-semibold">Vos notes</span>
          <textarea
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-sm focus:border-[var(--accent)] focus:outline-none"
            rows={5}
            placeholder="Minimum ~10 caractères pour valider l'étape…"
            value={draft.answers[activeStep]}
            onChange={(e) => updateAnswer(e.target.value)}
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-3">
          {prevLetter(activeStep) ? (
            <button
              type="button"
              onClick={() => setActiveStep(prevLetter(activeStep)!)}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
            >
              ← {prevLetter(activeStep)}
            </button>
          ) : null}
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
          >
            {nextLetter(activeStep)
              ? `${nextLetter(activeStep)} →`
              : "Terminer & synthétiser"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">Synthèse raffinée</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Alimente le pitch du Brainstorm — éditable avant envoi.
        </p>
        <textarea
          className="mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-sm focus:border-[var(--accent)] focus:outline-none"
          rows={6}
          value={draft.synthesis}
          onChange={(e) => {
            setDraft((prev) => ({ ...prev, synthesis: e.target.value }));
            setSaved(false);
          }}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={saveDraft}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
          >
            {saved ? "Enregistré ✓" : "Enregistrer SCAMPER"}
          </button>
          <button
            type="button"
            onClick={pushToBrainstorm}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
          >
            {pushedToBrainstorm ? "Envoyé au Brainstorm ✓" : "→ Brainstorm"}
          </button>
          <Link
            href={brainstormHref}
            className="rounded-lg border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10"
          >
            Ouvrir Brainstorm
          </Link>
          {workItem.mode === "free" ? (
            <Link
              href="/scamper/libre"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
            >
              Mes idées libres
            </Link>
          ) : (
            <Link
              href="/pick"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
            >
              Retour cartes
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
