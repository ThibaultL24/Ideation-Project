// src/components/workshop/brainstorm-directions-panel.tsx
"use client";

import type { BrainstormDirection, BrainstormReport } from "@/lib/workshop/brainstorm";

interface BrainstormDirectionsPanelProps {
  report: BrainstormReport;
  selectedId: string | null;
  onSelect: (direction: BrainstormDirection) => void;
  loadingDeepen?: boolean;
}

export function BrainstormDirectionsPanel({
  report,
  selectedId,
  onSelect,
  loadingDeepen,
}: BrainstormDirectionsPanelProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-violet-500/30 bg-violet-950/10 p-5 space-y-3">
        <h2 className="text-sm font-semibold">Territory explored</h2>
        <p className="text-sm leading-relaxed text-[var(--muted)] whitespace-pre-wrap">
          {report.territory}
        </p>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h3 className="text-xs font-medium text-[var(--accent)] mb-2">
          Questions to help you choose
        </h3>
        <ul className="list-disc pl-4 text-sm text-[var(--muted)] space-y-1">
          {report.clarifyingQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          5 product directions — pick one to develop
        </h2>
        <div className="grid gap-4">
          {report.directions.map((dir) => {
            const isRecommended = report.recommendedDirectionId === dir.id;
            const isSelected = selectedId === dir.id;
            return (
              <article
                key={dir.id}
                className={`rounded-xl border p-4 space-y-3 transition ${
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)]/5"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-violet-500/40"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold">{dir.title}</p>
                    <p className="text-sm text-[var(--muted)] mt-0.5">{dir.tagline}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] uppercase tracking-wide rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--muted)]">
                      {dir.angle}
                    </span>
                    {isRecommended && (
                      <span className="text-[10px] uppercase tracking-wide rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-[var(--accent)]">
                        Suggested
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2">
                  <p>
                    <strong className="text-white/80">Problem:</strong> {dir.problemHook}
                  </p>
                  <p>
                    <strong className="text-white/80">Intuition:</strong> {dir.intuitionFit}
                  </p>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  <strong className="text-white/80">MVP:</strong> {dir.mvpSketch}
                </p>
                <p className="text-xs text-[var(--accent)]/90">{dir.whyInteresting}</p>
                {dir.risks.length > 0 && (
                  <ul className="text-[10px] text-amber-400/80 list-disc pl-4">
                    {dir.risks.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  onClick={() => onSelect(dir)}
                  disabled={loadingDeepen}
                  className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loadingDeepen && isSelected
                    ? "Building deep research…"
                    : "Develop this direction →"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
