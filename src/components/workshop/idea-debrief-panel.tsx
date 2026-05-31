// src/components/workshop/idea-debrief-panel.tsx
"use client";

import type { IdeaDebrief } from "@/lib/workshop/idea-debrief";

const RECOMMENDATION_LABEL: Record<IdeaDebrief["recommendation"], string> = {
  pursue: "Poursuivre — l'idée est assez solide pour la fiche produit",
  pivot: "Pivoter — une variante vaut mieux que l'angle actuel",
  pause: "Pause — clarifier avant de publier",
};

const RECOMMENDATION_STYLE: Record<IdeaDebrief["recommendation"], string> = {
  pursue: "text-emerald-300 border-emerald-800/60",
  pivot: "text-amber-300 border-amber-800/60",
  pause: "text-blue-300 border-blue-800/60",
};

interface IdeaDebriefPanelProps {
  debrief: IdeaDebrief;
  source: string | null;
}

export function IdeaDebriefPanel({ debrief, source }: IdeaDebriefPanelProps) {
  return (
    <section className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
          Débrief de l&apos;idée
        </p>
        <h2 className="text-xl font-semibold leading-snug">{debrief.headline}</h2>
        <span
          className={`inline-block rounded border px-2 py-0.5 text-xs ${RECOMMENDATION_STYLE[debrief.recommendation]}`}
        >
          {RECOMMENDATION_LABEL[debrief.recommendation]}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-[var(--muted)] whitespace-pre-wrap">
        {debrief.analysis}
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-emerald-400/90">Pourquoi c&apos;est bien</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[var(--muted)]">
            {debrief.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-rose-400/90">Pourquoi c&apos;est fragile</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[var(--muted)]">
            {debrief.weaknesses.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-[var(--accent)]">À améliorer avant de publier</h3>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[var(--muted)]">
          {debrief.improvements.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      {debrief.alternatives.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Autres pistes</h3>
          {debrief.alternatives.map((alt, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4"
            >
              <p className="font-medium text-sm">{alt.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{alt.description}</p>
              <p className="mt-2 text-xs text-[var(--accent)]">
                Choisir si : {alt.whenToChoose}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
        <h3 className="text-sm font-medium">Fit Intuition</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">{debrief.intuitionFit}</p>
      </div>

      {source && (
        <p className="text-[10px] text-[var(--muted)]">Analyse : {source}</p>
      )}
    </section>
  );
}
