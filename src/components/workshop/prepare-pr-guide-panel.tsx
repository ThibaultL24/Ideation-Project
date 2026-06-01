// src/components/workshop/prepare-pr-guide-panel.tsx
"use client";

import type { PreparePrGuide } from "@/lib/workshop/prepare-pr-guide";

interface PreparePrGuidePanelProps {
  guide: PreparePrGuide;
}

export function PreparePrGuidePanel({ guide }: PreparePrGuidePanelProps) {
  return (
    <section className="space-y-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="space-y-2 border-b border-[var(--border)] pb-4">
        <h2 className="text-base font-semibold">{guide.headline}</h2>
        <p className="text-sm leading-relaxed text-[var(--muted)]">{guide.summary}</p>
        <p className="font-mono text-xs text-[var(--accent)] bg-black/30 rounded-lg px-3 py-2">
          Core triple for this idea: {guide.coreTripleLine}
        </p>
      </div>

      {guide.sections.map((section) => (
        <div key={section.id} className="space-y-2">
          <h3 className="text-sm font-medium text-white/90">{section.title}</h3>
          {section.paragraphs?.map((p, i) => (
            <p key={i} className="text-xs leading-relaxed text-[var(--muted)]">
              {p}
            </p>
          ))}
          {section.bullets && section.bullets.length > 0 && (
            <ul className="list-disc space-y-1.5 pl-4 text-xs text-[var(--muted)]">
              {section.bullets.map((b, i) => (
                <li key={i} className="leading-relaxed">
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <div className="rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/5 p-4 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
          Checklist before you open the PR
        </h3>
        <ul className="list-disc space-y-1 pl-4 text-xs text-[var(--muted)]">
          {guide.checklist.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
