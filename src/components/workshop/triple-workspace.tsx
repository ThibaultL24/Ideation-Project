// src/components/workshop/triple-workspace.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { EnrichedTripleDraft, EnrichedTripleLine } from "@/lib/assist/enrich-draft";
import type { GraphInspectResult } from "@/lib/intuition/graph-inspect";
import { formatTripleLine, runTripleLinter } from "@/lib/workshop/triple-draft";
import { loadSession, saveSession, type WorkshopSession } from "@/lib/workshop/session";
import { IntuitionInspectPanel } from "./intuition-inspect-panel";

function TripleCard({ line, badge }: { line: EnrichedTripleLine; badge: string }) {
  const oc = line.onchain;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase text-[var(--accent)]">
          {badge}
        </span>
        {line.recommended && (
          <span className="text-[10px] text-emerald-400">recommandé</span>
        )}
        {oc?.subjectStatus === "exists" && (
          <span className="text-[10px] text-blue-300">sujet onchain</span>
        )}
      </div>
      <p className="mt-2 font-mono text-sm">{formatTripleLine(line)}</p>
      <p className="mt-2 text-xs text-[var(--muted)]">{line.rationale}</p>
      {oc && (
        <div className="mt-3 space-y-1 border-t border-[var(--border)] pt-2 font-mono text-[10px] text-[var(--muted)]">
          {oc.subjectTermId && <p>subject: {oc.subjectTermId.slice(0, 18)}…</p>}
          {oc.predicateTermId && <p>predicate: {oc.predicateTermId.slice(0, 18)}…</p>}
          {oc.objectTermId && <p>object: {oc.objectTermId.slice(0, 18)}…</p>}
          {oc.tripleTermId && <p>triple: {oc.tripleTermId.slice(0, 18)}…</p>}
        </div>
      )}
    </div>
  );
}

export function TripleWorkspace() {
  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [draft, setDraft] = useState<EnrichedTripleDraft | null>(null);
  const [graphInspect, setGraphInspect] = useState<GraphInspectResult | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [activeNetwork, setActiveNetwork] = useState<"testnet" | "mainnet">("testnet");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadSession();
    setSession(stored);
    if (stored?.tripleDraft) setDraft(stored.tripleDraft as EnrichedTripleDraft);
  }, []);

  const ideaTitle =
    session?.catalogTitle?.trim() ||
    session?.rawIntent.trim().slice(0, 80) ||
    "New Idea";

  const loadInspect = useCallback(async () => {
    if (!session) return;
    setInspectLoading(true);
    try {
      const res = await fetch("/api/intuition/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawIntent: session.rawIntent,
          ideaTitle,
          canonicalId: session.catalogCanonicalId,
        }),
      });
      const data = await res.json();
      if (data.networks) setGraphInspect(data as GraphInspectResult);
    } finally {
      setInspectLoading(false);
    }
  }, [session, ideaTitle]);

  useEffect(() => {
    if (session) void loadInspect();
  }, [session, loadInspect]);

  const generate = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const res = await fetch("/api/assist/triples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawIntent: session.rawIntent,
        refinementSummary: session.refinementSummary,
        picks: session.picks.map((p) => ({ title: p.title })),
        ideaTitle,
        catalogDescription: session.catalogDescription,
        canonicalId: session.catalogCanonicalId,
      }),
    });
    const data = await res.json();
    if (data.draft) {
      const next = {
        ...data.draft,
        linterWarnings: runTripleLinter(data.draft),
      } as EnrichedTripleDraft;
      setDraft(next);
      setSource(data.source);
      if (data.graphInspect) setGraphInspect(data.graphInspect);
      const updated = { ...session, tripleDraft: next };
      saveSession(updated);
      setSession(updated);
    }
    setLoading(false);
  }, [session, ideaTitle]);

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
          Brainstorm · triples ancrés graphe
        </p>
        <h1 className="text-2xl font-bold">{ideaTitle}</h1>
        <p className="text-sm text-[var(--muted)] whitespace-pre-wrap">
          {session.refinementSummary || session.rawIntent}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void generate()}
              disabled={loading}
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
            >
              {loading ? "Analyse graphe + IA…" : "Proposer triples (graphe + IA)"}
            </button>
            <button
              type="button"
              onClick={() => void loadInspect()}
              disabled={inspectLoading}
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm"
            >
              Rafraîchir graphe
            </button>
            <Link
              href="/workshop/refine"
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm"
            >
              ← Cartes
            </Link>
          </div>

          {source && (
            <p className="text-xs text-[var(--muted)]">
              Source : {source === "openai" ? "OpenAI + GraphQL" : "Graphe testnet (fallback)"}
            </p>
          )}

          {draft?.graphSummary && draft.graphSummary.length > 0 && (
            <ul className="rounded-lg border border-blue-900/40 bg-blue-950/20 p-4 text-xs text-blue-200/90">
              {draft.graphSummary.map((s, i) => (
                <li key={i}>· {s}</li>
              ))}
            </ul>
          )}

          {draft && (
            <div className="space-y-6">
              <section className="space-y-3">
                <h2 className="text-sm font-semibold">Pitch affiné</h2>
                <p className="text-sm leading-relaxed">{draft.refinedPitch}</p>
                <p className="text-xs text-[var(--muted)]">{draft.archetypeSummary}</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold">Triple cœur (bounty)</h2>
                <TripleCard line={draft.coreTriple} badge="core" />
              </section>

              {draft.supportTriples.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold">Triples de soutien</h2>
                  <div className="space-y-2">
                    {draft.supportTriples.map((line, i) => (
                      <TripleCard key={i} line={line} badge="support" />
                    ))}
                  </div>
                </section>
              )}

              {draft.nestedTriples.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold">Triples imbriqués</h2>
                  <p className="text-xs text-amber-400/90">
                    Provenance uniquement — à publier avec prudence.
                  </p>
                  <div className="space-y-2">
                    {draft.nestedTriples.map((line, i) => (
                      <TripleCard key={i} line={line} badge="nested" />
                    ))}
                  </div>
                </section>
              )}

              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <h3 className="text-sm font-semibold">Linter</h3>
                <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                  {(draft.linterWarnings.length > 0
                    ? draft.linterWarnings
                    : ["OK"]
                  ).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {!draft && !loading && (
            <p className="text-sm text-[var(--muted)]">
              L&apos;IA interroge testnet et mainnet, puis propose des triples calés sur les atoms
              et prédicats réels du graphe.
            </p>
          )}
        </div>

        <IntuitionInspectPanel
          data={graphInspect}
          loading={inspectLoading}
          activeNetwork={activeNetwork}
          onNetworkChange={setActiveNetwork}
        />
      </div>
    </div>
  );
}
