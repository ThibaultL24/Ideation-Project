// src/components/workshop/brainstorm-workspace.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_IDEA_BRIEF,
  normalizeIdeaBrief,
  openQuestionsFromText,
  openQuestionsToText,
  type IdeaBrief,
} from "@/lib/workshop/idea-brief";
import { normalizeIdeaDebrief, type IdeaDebrief } from "@/lib/workshop/idea-debrief";
import { loadSession, saveSession, type WorkshopSession } from "@/lib/workshop/session";
import { IdeaDebriefPanel } from "./idea-debrief-panel";

const FIELDS: Array<{ key: keyof IdeaBrief; label: string; rows: number; hint: string }> = [
  { key: "oneLiner", label: "En une phrase", rows: 2, hint: "Elevator pitch" },
  { key: "problem", label: "Problème", rows: 3, hint: "Qui souffre, de quoi ?" },
  { key: "solution", label: "Solution", rows: 3, hint: "Que fait le produit concrètement ?" },
  { key: "targetUsers", label: "Utilisateurs cibles", rows: 2, hint: "Les 100 premiers" },
  { key: "whyNow", label: "Pourquoi maintenant", rows: 2, hint: "Timing, opportunité" },
  {
    key: "intuitionAngle",
    label: "Angle Intuition",
    rows: 3,
    hint: "Pourquoi Intuition structurellement — sans écrire de triples",
  },
  {
    key: "trustMechanism",
    label: "Mécanisme de confiance",
    rows: 3,
    hint: "Qui stake, sur quelles claims, quels atoms, qui interroge le graphe",
  },
  { key: "mvpScope", label: "Périmètre MVP", rows: 2, hint: "Must-have uniquement" },
];

type BrainstormPhase = "questions" | "debrief" | "brief";

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs ${
        active
          ? "border-[var(--accent)] text-[var(--accent)]"
          : done
            ? "border-emerald-800/50 text-emerald-400/90"
            : "border-[var(--border)] text-[var(--muted)]"
      }`}
    >
      {label}
    </span>
  );
}

export function BrainstormWorkspace() {
  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [phase, setPhase] = useState<BrainstormPhase>("questions");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [debrief, setDebrief] = useState<IdeaDebrief | null>(null);
  const [brief, setBrief] = useState<IdeaBrief>(EMPTY_IDEA_BRIEF);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingDebrief, setLoadingDebrief] = useState(false);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [debriefSource, setDebriefSource] = useState<string | null>(null);
  const [briefSource, setBriefSource] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const ideaTitle =
    session?.catalogTitle?.trim() ||
    session?.rawIntent.trim().slice(0, 80) ||
    "New Idea";

  const loadQuestions = useCallback(async (s: WorkshopSession) => {
    if (s.debriefQuestions?.length) {
      setQuestions(s.debriefQuestions);
      return;
    }
    setLoadingQuestions(true);
    const res = await fetch("/api/assist/debrief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "questions",
        rawIntent: s.rawIntent,
        refinementSummary: s.refinementSummary,
        picks: s.picks,
        ideaTitle,
        catalogDescription: s.catalogDescription,
        coachQuestions: s.debriefQuestions,
      }),
    });
    const data = await res.json();
    if (data.questions?.length) {
      setQuestions(data.questions);
      const updated = { ...s, debriefQuestions: data.questions as string[] };
      saveSession(updated);
      setSession(updated);
    }
    setLoadingQuestions(false);
  }, [ideaTitle]);

  useEffect(() => {
    const stored = loadSession();
    setSession(stored);
    if (!stored?.rawIntent) return;

    if (stored.ideaBrief?.oneLiner) {
      setBrief(stored.ideaBrief);
      setPhase(stored.ideaDebrief ? "brief" : "debrief");
    } else if (stored.ideaDebrief) {
      setDebrief(stored.ideaDebrief);
      setPhase("debrief");
    }

    if (stored.debriefAnswers?.length) {
      const map: Record<number, string> = {};
      stored.debriefAnswers.forEach((a, i) => {
        map[i] = a.answer;
      });
      setAnswers(map);
    }

    if (stored.debriefQuestions?.length) {
      setQuestions(stored.debriefQuestions);
    } else {
      void loadQuestions(stored);
    }
  }, [loadQuestions]);

  const persistAnswers = useCallback(
    (qs: string[], answerMap: Record<number, string>) => {
      if (!session) return;
      const debriefAnswers = qs.map((question, i) => ({
        question,
        answer: answerMap[i]?.trim() ?? "",
      }));
      const updated = { ...session, debriefAnswers };
      saveSession(updated);
      setSession(updated);
      return debriefAnswers;
    },
    [session],
  );

  const synthesizeFromSession = useCallback(
    async (base: WorkshopSession) => {
      setLoadingBrief(true);
      const res = await fetch("/api/assist/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawIntent: base.rawIntent,
          refinementSummary: base.refinementSummary,
          picks: base.picks.map((p) => ({ title: p.title })),
          ideaTitle,
          catalogDescription: base.catalogDescription,
          debriefAnswers: base.debriefAnswers,
          ideaDebrief: base.ideaDebrief,
        }),
      });
      const data = await res.json();
      if (data.brief) {
        const next = normalizeIdeaBrief(data.brief, ideaTitle);
        setBrief(next);
        setBriefSource(data.source);
        setPhase("brief");
        const updated = { ...base, ideaBrief: next, tripleDraft: undefined };
        saveSession(updated);
        setSession(updated);
        setSaved(true);
        setLoadingBrief(false);
        return updated;
      }
      setLoadingBrief(false);
      return base;
    },
    [ideaTitle],
  );

  const synthesize = useCallback(async () => {
    if (!session) return;
    await synthesizeFromSession(session);
  }, [session, synthesizeFromSession]);

  const runDebrief = useCallback(async () => {
    if (!session || questions.length === 0) return;
    const debriefAnswers = persistAnswers(questions, answers) ?? [];
    const minAnswers = debriefAnswers.filter((a) => a.answer.length >= 8).length;
    if (minAnswers < 2) return;

    setLoadingDebrief(true);
    const res = await fetch("/api/assist/debrief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "analyze",
        rawIntent: session.rawIntent,
        refinementSummary: session.refinementSummary,
        picks: session.picks,
        ideaTitle,
        catalogDescription: session.catalogDescription,
        canonicalId: session.catalogCanonicalId,
        answers: debriefAnswers,
      }),
    });
    const data = await res.json();
    if (data.debrief) {
      const nextDebrief = normalizeIdeaDebrief(data.debrief);
      setDebrief(nextDebrief);
      setDebriefSource(data.source);
      const withDebrief = { ...session, ideaDebrief: nextDebrief, debriefAnswers };
      saveSession(withDebrief);
      setSession(withDebrief);
      setPhase("brief");
      setLoadingDebrief(false);
      await synthesizeFromSession(withDebrief);
      return;
    }
    setLoadingDebrief(false);
  }, [session, questions, answers, ideaTitle, persistAnswers, synthesizeFromSession]);

  function updateField(key: keyof IdeaBrief, value: string) {
    const next = { ...brief, [key]: value };
    setBrief(next);
    setSaved(false);
    if (session) {
      saveSession({ ...session, ideaBrief: next });
      setSession({ ...session, ideaBrief: next });
    }
  }

  function updateOpenQuestions(text: string) {
    const next = { ...brief, openQuestions: openQuestionsFromText(text) };
    setBrief(next);
    setSaved(false);
    if (session) {
      saveSession({ ...session, ideaBrief: next });
      setSession({ ...session, ideaBrief: next });
    }
  }

  const answeredCount = questions.filter((_, i) => (answers[i]?.trim().length ?? 0) >= 8).length;
  const canDebrief = answeredCount >= 2 && !loadingDebrief;
  const readyForPublish =
    brief.problem.trim().length > 20 && brief.solution.trim().length > 20;

  if (!session?.rawIntent) {
    return (
      <div className="rounded-xl border border-[var(--border)] p-6">
        <p className="text-[var(--muted)]">Session vide.</p>
        <Link href="/workshop" className="mt-4 inline-block text-[var(--accent)]">
          Démarrer l&apos;atelier
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
          Étape 2 (suite) · Débrief puis fiche
        </p>
        <h1 className="text-2xl font-bold">{ideaTitle}</h1>
        <p className="text-sm text-[var(--muted)]">
          L&apos;IA propose le débrief et la fiche produit — tu corriges chaque champ avant
          de publier.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <StepPill active={phase === "questions"} done={!!debrief} label="1 · Questions" />
          <StepPill active={phase === "debrief"} done={!!brief.oneLiner} label="2 · Débrief" />
          <StepPill active={phase === "brief"} done={readyForPublish} label="3 · Fiche" />
        </div>
      </header>

      {(phase === "questions" || (phase === "debrief" && !debrief)) && (
        <section className="space-y-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold">Questions de fin d&apos;affinage</h2>
          <p className="text-sm text-[var(--muted)]">
            Ces questions servent à produire le débrief : pourquoi c&apos;est bien, ce qui
            manque, et d&apos;autres pistes possibles.
          </p>

          {loadingQuestions && questions.length === 0 && (
            <p className="text-sm text-[var(--muted)]">Préparation des questions…</p>
          )}

          {questions.map((q, i) => (
            <label key={i} className="block space-y-2">
              <span className="text-sm font-medium">{q}</span>
              <textarea
                value={answers[i] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                placeholder="Ta réponse (2-3 phrases)"
              />
            </label>
          ))}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void runDebrief()}
              disabled={!canDebrief}
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
            >
              {loadingDebrief || loadingBrief
                ? "Analyse et proposition…"
                : "Analyser et proposer la fiche"}
            </button>
            <Link
              href="/workshop/refine"
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm"
            >
              ← Cartes
            </Link>
          </div>

          {questions.length > 0 && answeredCount < 2 && (
            <p className="text-xs text-amber-400/90">
              Réponds à au moins 2 questions (quelques phrases chacune) pour lancer le débrief.
            </p>
          )}
        </section>
      )}

      {debrief && (phase === "debrief" || phase === "brief") && (
        <IdeaDebriefPanel debrief={debrief} source={debriefSource} />
      )}

      {debrief && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setPhase("questions")}
            className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm"
          >
            Modifier mes réponses
          </button>
        </div>
      )}

      {(debrief || loadingBrief || brief.oneLiner) && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void synthesize()}
              disabled={loadingBrief || !debrief}
              className="rounded-lg border border-[var(--accent)] px-5 py-2.5 text-sm text-[var(--accent)] disabled:opacity-50"
            >
              {loadingBrief ? "Proposition…" : "Reproposer la fiche (IA)"}
            </button>
            {readyForPublish && (
              <Link
                href="/workshop/prepare"
                className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black"
              >
                Fiche validée → PR GitHub
              </Link>
            )}
          </div>

          {briefSource && (
            <p className="text-xs text-[var(--muted)]">
              Proposition IA ({briefSource === "openai" ? "OpenAI" : "modèle local"})
              {saved ? " · enregistrée" : ""}
              {!saved && " · modifie un champ pour marquer ta relecture"}
            </p>
          )}

          <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Fiche produit — à corriger</h2>
              <p className="text-sm text-[var(--muted)]">
                Texte proposé par l&apos;IA à partir du débrief. Ajuste tout ce qui ne te
                convient pas — c&apos;est ta version qui partira en publication.
              </p>
            </div>

            {loadingBrief && !brief.oneLiner && (
              <p className="text-sm text-[var(--muted)]">Rédaction de la proposition…</p>
            )}
            <label className="block space-y-2">
              <span className="text-sm font-medium">Titre</span>
              <input
                value={brief.title}
                onChange={(e) => updateField("title", e.target.value)}
                disabled={loadingBrief && !brief.title}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-50"
              />
            </label>

            {FIELDS.map((field) => (
              <label key={field.key} className="block space-y-2">
                <span className="text-sm font-medium">{field.label}</span>
                <span className="block text-xs text-[var(--muted)]">{field.hint}</span>
                <textarea
                  value={brief[field.key]}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  rows={field.rows}
                  disabled={loadingBrief && !brief[field.key]}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-50"
                />
              </label>
            ))}

            <label className="block space-y-2">
              <span className="text-sm font-medium">Questions ouvertes</span>
              <span className="block text-xs text-[var(--muted)]">
                Une question par ligne — issues du débrief si besoin
              </span>
              <textarea
                value={openQuestionsToText(brief.openQuestions)}
                onChange={(e) => updateOpenQuestions(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
