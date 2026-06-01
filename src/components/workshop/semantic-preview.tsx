// src/components/workshop/semantic-preview.tsx
"use client";

import {
  BOUNTY_PREDICATE_LABEL,
  INTUITION_PROTOCOL_OBJECT_LABEL,
} from "@/lib/intuition/config";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import type { IdeaBrief } from "@/lib/workshop/idea-brief";
import { semanticWarningsFromContext } from "@/lib/workshop/graph-context-types";
import type { WorkshopGraphContext } from "@/lib/workshop/graph-context-types";
import { formatTripleLine } from "@/lib/workshop/triple-draft";

interface SemanticPreviewProps {
  ideaTitle: string;
  ideaBrief?: IdeaBrief;
  tripleDraft?: EnrichedTripleDraft | null;
  graphContext?: WorkshopGraphContext | null;
  showCreateVsSignal?: boolean;
}

export function SemanticPreview({
  ideaTitle,
  ideaBrief,
  tripleDraft,
  graphContext,
  showCreateVsSignal = false,
}: SemanticPreviewProps) {
  const mainAtom = ideaTitle.trim() || "—";
  const coreSubject = tripleDraft?.coreTriple.subject ?? ideaBrief?.title ?? mainAtom;
  const corePredicate = tripleDraft?.coreTriple.predicate ?? BOUNTY_PREDICATE_LABEL;
  const coreObject = tripleDraft?.coreTriple.object ?? INTUITION_PROTOCOL_OBJECT_LABEL;

  const graphWarnings = semanticWarningsFromContext(graphContext);
  const draftWarnings = (tripleDraft?.linterWarnings ?? []).slice(0, 4);

  return (
    <aside className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs">
      <p className="text-[10px] uppercase tracking-widest text-[var(--accent)]">
        Semantic preview
      </p>

      <div>
        <p className="mb-1 font-medium text-white/90">Main atom</p>
        <p className="font-mono text-[var(--muted)]">{mainAtom}</p>
      </div>

      <div>
        <p className="mb-1 font-medium text-white/90">Core triple</p>
        <p className="font-mono text-[var(--muted)]">
          {formatTripleLine({
            subject: coreSubject,
            predicate: corePredicate,
            object: coreObject,
            rationale: "",
            kind: "core",
            recommended: true,
          })}
        </p>
      </div>

      {(graphWarnings.length > 0 || draftWarnings.length > 0) && (
        <ul className="space-y-1 text-amber-400/90">
          {[...graphWarnings, ...draftWarnings].map((w, i) => (
            <li key={i}>⚠ {w}</li>
          ))}
        </ul>
      )}

      {showCreateVsSignal && (
        <p className="rounded-lg border border-[var(--border)] bg-black/20 p-2 text-[10px] leading-relaxed text-[var(--muted)]">
          <strong className="text-white/80">Graph ≠ GitHub.</strong> Atoms and triples are the
          reputation layer; a PR only documents the idea for humans.
        </p>
      )}
    </aside>
  );
}
