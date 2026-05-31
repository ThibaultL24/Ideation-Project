// src/components/workshop/brainstorm-workspace.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_IDEA_BRIEF,
  normalizeIdeaBrief,
  type IdeaBrief,
} from "@/lib/workshop/idea-brief";
import { loadSession, saveSession, type WorkshopSession } from "@/lib/workshop/session";

const FIELDS: Array<{ key: keyof IdeaBrief; label: string; rows: number; hint: string }> = [
  { key: "oneLiner", label: "En une phrase", rows: 2, hint: "Elevator pitch" },
  { key: "problem", label: "Problème", rows: 3, hint: "Qui souffre, de quoi ?" },
  { key: "solution", label: "Solution", rows: 3, hint: "Que fait le produit concrètement ?" },
  { key: "targetUsers", label: "Utilisateurs cibles", rows: 2, hint: "Les 100 premiers" },
  { key: "whyNow", label: "Pourquoi maintenant", rows: 2, hint: "Timing, opportunité" },
  {
    key: "intuitionAngle",
    label: "Angle Intuition (sans triples)",
    rows: 3,
    hint: "Attestations, signal, graphe — en langage simple",
  },
  { key: "mvpScope", label: "Périmètre MVP", rows: 2, hint: "3 écrans max" },
  { key: "openQuestions", label: "Questions ouvertes", rows: 2, hint: "Ce qu'il reste à trancher" },
];

export function BrainstormWorkspace() {
  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [brief, setBrief] = useState<IdeaBrief>(EMPTY_IDEA_BRIEF);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = loadSession();
    setSession(stored);
    if (stored?.ideaBrief) {
      setBrief(stored.ideaBrief);
    }
  }, []);

  const ideaTitle =
    session?.catalogTitle?.trim() ||
    session?.rawIntent.trim().slice(0, 80) ||
    "New Idea";

  const synthesize = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const res = await fetch("/api/assist/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawIntent: session.rawIntent,
        refinementSummary: session.refinementSummary,
        picks: session.picks.map((p) => ({ title: p.title })),
        ideaTitle,
        catalogDescription: session.catalogDescription,
      }),
    });
    const data = await res.json();
    if (data.brief) {
      const next = normalizeIdeaBrief(data.brief, ideaTitle);
      setBrief(next);
      setSource(data.source);
      const updated = { ...session, ideaBrief: next, tripleDraft: undefined };
      saveSession(updated);
      setSession(updated);
      setSaved(true);
    }
    setLoading(false);
  }, [session, ideaTitle]);

  function updateField(key: keyof IdeaBrief, value: string) {
    const next = { ...brief, [key]: value };
    setBrief(next);
    setSaved(false);
    if (session) {
      const updated = { ...session, ideaBrief: next };
      saveSession(updated);
      setSession(updated);
    }
  }

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
          Brainstorm · consolider l&apos;idée
        </p>
        <h1 className="text-2xl font-bold">{ideaTitle}</h1>
        <p className="text-sm text-[var(--muted)]">
          Pas de triples ici — on affine le produit. L&apos;écriture Intuition vient à
          l&apos;étape <strong>Publier</strong>.
        </p>
        <p className="text-xs text-[var(--muted)] whitespace-pre-wrap">
          {session.refinementSummary}
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void synthesize()}
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
        >
          {loading ? "Synthèse…" : brief.oneLiner ? "Régénérer la synthèse" : "Synthétiser avec l'IA"}
        </button>
        <Link
          href="/workshop/refine"
          className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm"
        >
          ← Cartes
        </Link>
        {readyForPublish && (
          <Link
            href="/workshop/prepare"
            className="rounded-lg border border-[var(--accent)] px-5 py-2.5 text-sm text-[var(--accent)]"
          >
            Idée claire → Publier
          </Link>
        )}
      </div>

      {source && (
        <p className="text-xs text-[var(--muted)]">
          Synthèse : {source === "openai" ? "OpenAI" : "modèle local"}
          {saved ? " · enregistré" : ""}
        </p>
      )}

      <div className="space-y-6">
        <label className="block space-y-2">
          <span className="text-sm font-medium">Titre</span>
          <input
            value={brief.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm"
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
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            />
          </label>
        ))}
      </div>

      {!brief.oneLiner && !loading && (
        <p className="text-sm text-[var(--muted)]">
          Lance la synthèse IA pour remplir la fiche, puis ajuste à la main.
        </p>
      )}
    </div>
  );
}
