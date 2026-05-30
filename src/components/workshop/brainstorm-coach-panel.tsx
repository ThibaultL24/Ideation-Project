// src/components/workshop/brainstorm-coach-panel.tsx
"use client";

import type { BrainstormCoach } from "@/lib/assist/generate-brainstorm";

interface BrainstormCoachPanelProps {
  coach: BrainstormCoach | null;
  loading: boolean;
  source: string | null;
  onRefresh: () => void;
}

export function BrainstormCoachPanel({
  coach,
  loading,
  source,
  onRefresh,
}: BrainstormCoachPanelProps) {
  return (
    <aside className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <h3 className="text-sm font-semibold">Coach IA · brainstorming</h3>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="text-xs text-[var(--accent)] disabled:opacity-50"
        >
          {loading ? "…" : "Actualiser"}
        </button>
      </div>
      <div className="space-y-4 p-4 text-sm">
        {!coach && !loading && (
          <p className="text-xs text-[var(--muted)]">
            L&apos;assistant analyse le graphe testnet/mainnet pour guider tes cartes.
          </p>
        )}
        {coach && (
          <>
            <p className="leading-relaxed text-[var(--foreground)]">{coach.reflection}</p>
            <div>
              <h4 className="text-xs font-medium uppercase text-[var(--accent)]">Questions</h4>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[var(--muted)]">
                {coach.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
            {coach.graphInsights.length > 0 && (
              <div>
                <h4 className="text-xs font-medium uppercase text-[var(--accent)]">
                  Données graphe
                </h4>
                <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                  {coach.graphInsights.map((g, i) => (
                    <li key={i}>· {g}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs text-[var(--muted)]">
              <span className="text-[var(--foreground)]">Cartes : </span>
              {coach.cardGuidance}
            </p>
            {coach.risks.length > 0 && (
              <ul className="text-xs text-amber-400/90">
                {coach.risks.map((r, i) => (
                  <li key={i}>⚠ {r}</li>
                ))}
              </ul>
            )}
          </>
        )}
        {source && (
          <p className="text-[10px] text-[var(--muted)]">Source : {source}</p>
        )}
      </div>
    </aside>
  );
}
