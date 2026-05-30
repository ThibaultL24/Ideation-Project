// src/components/brainstorm/semantic-assistant.tsx
"use client";

import type { SemanticDraft, SemanticLint } from "@/lib/ideas/brainstorm-session";

interface PreflightState {
  subjectExists: boolean;
  predicateExists: boolean;
  objectExists: boolean;
  tripleExists: boolean;
  predictedTripleId: string | null;
  canonical: {
    subject: string | null;
    predicate: string | null;
    object: string | null;
  };
}

interface SemanticAssistantProps {
  semantic: SemanticDraft;
  lints: SemanticLint[];
  preflight: PreflightState | null;
  loading: boolean;
}

const LINT_ICON: Record<SemanticLint["status"], string> = {
  pass: "text-emerald-400",
  warn: "text-amber-400",
  fail: "text-red-400",
};

function ExistsBadge({ exists, label }: { exists: boolean; label: string }) {
  return (
    <span
      className={`rounded border px-2 py-0.5 text-[10px] ${
        exists
          ? "border-emerald-800/60 text-emerald-300"
          : "border-slate-700 text-[var(--muted)]"
      }`}
    >
      {label}: {exists ? "existe" : "nouveau"}
    </span>
  );
}

export function SemanticAssistant({
  semantic,
  lints,
  preflight,
  loading,
}: SemanticAssistantProps) {
  return (
    <aside className="flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-sm font-semibold">Assistant sémantique</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Linter protocolaire · triple cœur
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Atoms candidats
          </h3>
          <ul className="mt-2 space-y-2 text-sm">
            <li className="rounded-lg bg-[var(--background)] p-2">
              <span className="text-blue-400">Sujet</span> · {semantic.ideaAtomLabel}
            </li>
            <li className="rounded-lg bg-[var(--background)] p-2">
              <span className="text-orange-400">Prédicat</span> · {semantic.predicate}
            </li>
            <li className="rounded-lg bg-[var(--background)] p-2">
              <span className="text-purple-400">Objet</span> · {semantic.object}
            </li>
          </ul>
          {preflight ? (
            <div className="mt-2 flex flex-wrap gap-1">
              <ExistsBadge exists={preflight.subjectExists} label="Sujet" />
              <ExistsBadge exists={preflight.predicateExists} label="Prédicat" />
              <ExistsBadge exists={preflight.objectExists} label="Objet" />
              <ExistsBadge exists={preflight.tripleExists} label="Triple" />
            </div>
          ) : loading ? (
            <p className="mt-2 text-xs text-[var(--muted)]">Vérification graphe…</p>
          ) : null}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Triple cœur
          </h3>
          <p className="mt-2 rounded-lg bg-[var(--background)] p-3 font-mono text-xs leading-relaxed">
            <span className="text-blue-400">{semantic.coreTriple[0]}</span>
            {" → "}
            <span className="text-orange-400">{semantic.coreTriple[1]}</span>
            {" → "}
            <span className="text-purple-400">{semantic.coreTriple[2]}</span>
          </p>
          {preflight?.predictedTripleId ? (
            <p className="mt-2 break-all text-[10px] text-[var(--muted)]">
              ID prédit : {preflight.predictedTripleId.slice(0, 18)}…
            </p>
          ) : null}
        </div>

        {semantic.supportTriplesSuggested.length > 0 ? (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Triples de soutien (suggestions locales)
            </h3>
            <ul className="mt-2 space-y-2">
              {semantic.supportTriplesSuggested.map((triple) => (
                <li
                  key={triple.join("-")}
                  className="rounded-lg border border-dashed border-[var(--border)] p-2 font-mono text-[10px] text-[var(--muted)]"
                >
                  {triple.join(" → ")}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Linter sémantique
          </h3>
          <ul className="mt-2 space-y-2">
            {lints.map((lint) => (
              <li
                key={lint.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-2"
              >
                <p className={`text-xs font-medium ${LINT_ICON[lint.status]}`}>
                  {lint.label}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  {lint.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
