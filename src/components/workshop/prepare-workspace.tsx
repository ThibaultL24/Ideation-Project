// src/components/workshop/prepare-workspace.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { EnrichedTripleDraft } from "@/lib/assist/enrich-draft";
import type { WorkshopPublishResult } from "@/lib/intuition/publish-workshop";
import type { OnchainPublishSummary } from "@/lib/workshop/decent-rep";
import { formatTripleLine } from "@/lib/workshop/triple-draft";
import type { WorkshopPublishPlan } from "@/lib/workshop/publish-plan";
import { loadSession, saveSession, type WorkshopSession } from "@/lib/workshop/session";
import { DecentRepPanel } from "./decent-rep-panel";
import { SemanticPreview } from "./semantic-preview";

export function PrepareWorkspace() {
  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [plan, setPlan] = useState<WorkshopPublishPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [triplesLoading, setTriplesLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubResult, setGithubResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  const fetchPlan = useCallback(async (s: WorkshopSession) => {
    setLoadingPlan(true);
    const res = await fetch("/api/workshop/prepare/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: s }),
    });
    const data = await res.json();
    if (data.plan) setPlan(data.plan as WorkshopPublishPlan);
    setLoadingPlan(false);
  }, []);

  useEffect(() => {
    if (session) void fetchPlan(session);
  }, [session, fetchPlan]);

  async function generateTriples() {
    if (!session) return;
    setTriplesLoading(true);
    const res = await fetch("/api/assist/triples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });
    const data = await res.json();
    if (data.draft) {
      const updated = {
        ...session,
        tripleDraft: data.draft as EnrichedTripleDraft,
      };
      saveSession(updated);
      setSession(updated);
      void fetchPlan(updated);
    }
    setTriplesLoading(false);
  }

  function handleOnchainPublished(summary: OnchainPublishSummary, _raw: WorkshopPublishResult) {
    if (!session) return;
    const updated = { ...session, onchainPublish: summary };
    saveSession(updated);
    setSession(updated);
  }

  async function createPr() {
    if (!session) return;
    setGithubLoading(true);
    setGithubResult(null);
    const res = await fetch("/api/workshop/prepare/github-pr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });
    setGithubResult(await res.json());
    setGithubLoading(false);
  }

  if (!session?.rawIntent) {
    return (
      <div className="rounded-xl border border-[var(--border)] p-6">
        <p className="text-[var(--muted)]">Empty session.</p>
        <Link href="/workshop" className="mt-4 inline-block text-[var(--accent)]">
          Start workshop
        </Link>
      </div>
    );
  }

  if (!session.ideaBrief?.problem?.trim()) {
    return (
      <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-6 space-y-4">
        <p className="text-sm">Run deep research first.</p>
        <Link href="/workshop/research" className="text-[var(--accent)]">
          ← Research
        </Link>
      </div>
    );
  }

  const brief = session.ideaBrief;
  const draft = session.tripleDraft;
  const hasTriples = Boolean(draft);
  const onchainDone = Boolean(session.onchainPublish);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_260px]">
      <div className="space-y-8 min-w-0">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
            Step 2 of 2 · Decentralized reputation
          </p>
          <h1 className="text-2xl font-bold">{brief.title || session.catalogTitle}</h1>
          <p className="text-sm text-[var(--muted)]">{brief.oneLiner}</p>
          <p className="text-xs text-[var(--muted)]">
            Validate your semantic model, publish atoms and triples on the Intuition graph,
            then optionally submit the write-up to intuition-box on GitHub.
          </p>
        </header>

        {!hasTriples && (
          <section className="space-y-4 rounded-xl border border-[var(--accent)]/30 p-5">
            <h2 className="text-sm font-semibold">Reputation model</h2>
            <p className="text-xs text-[var(--muted)]">
              AI drafts atoms and triples aligned with the bounty pattern and your research
              brief. Required core: [title] → top project ideas for → Intuition Protocol.
            </p>
            <button
              type="button"
              onClick={() => void generateTriples()}
              disabled={triplesLoading}
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
            >
              {triplesLoading ? "Building model…" : "Build reputation model"}
            </button>
          </section>
        )}

        {hasTriples && draft && (
          <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Semantic model</h2>
              <button
                type="button"
                onClick={() => void generateTriples()}
                disabled={triplesLoading}
                className="text-xs text-[var(--accent)] disabled:opacity-50"
              >
                {triplesLoading ? "Regenerating…" : "Regenerate"}
              </button>
            </div>
            <p className="font-mono text-xs text-[var(--muted)]">
              {formatTripleLine(draft.coreTriple)}
            </p>
            {draft.supportTriples.map((t, i) => (
              <p key={i} className="font-mono text-xs text-[var(--muted)]">
                support · {formatTripleLine(t)}
              </p>
            ))}
            {draft.nestedTriples.map((t, i) => (
              <p key={i} className="font-mono text-xs text-amber-400/80">
                nested · {formatTripleLine(t)}
              </p>
            ))}
            {(draft.linterWarnings?.length ?? 0) > 0 && (
              <ul className="text-xs text-amber-400/90">
                {draft.linterWarnings.map((w, i) => (
                  <li key={i}>⚠ {w}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        {loadingPlan && hasTriples && (
          <p className="text-sm text-[var(--muted)]">Loading publish plan…</p>
        )}

        {hasTriples && plan && (
          <DecentRepPanel
            session={session}
            plan={plan}
            existingPublish={session.onchainPublish}
            onPublished={handleOnchainPublished}
          />
        )}

        {hasTriples && plan && (
          <details className="rounded-xl border border-[var(--border)] bg-[var(--card)] group">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
              Optional · GitHub PR (community review)
            </summary>
            <div className="space-y-4 border-t border-[var(--border)] p-4">
              <p className="text-xs text-[var(--muted)]">
                The PR documents your idea for human review. It does not replace on-chain
                reputation — publish on Intuition first when you can.
              </p>

              <details className="rounded-lg border border-[var(--border)] bg-black/20">
                <summary className="cursor-pointer px-3 py-2 text-xs">
                  README preview
                </summary>
                <pre className="max-h-48 overflow-auto p-3 text-xs whitespace-pre-wrap text-[var(--muted)]">
                  {plan.markdown}
                </pre>
              </details>

              <button
                type="button"
                onClick={() => void createPr()}
                disabled={githubLoading || !plan.readiness.githubReady}
                className="w-full rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm hover:border-[var(--accent)] disabled:opacity-40"
              >
                {githubLoading ? "Opening PR…" : "Create GitHub PR"}
              </button>

              {onchainDone && (
                <p className="text-[10px] text-emerald-400/80">
                  On-chain publish complete — link your PR comment to the atom when ready.
                </p>
              )}

              {githubResult?.mode === "manual" && (
                <div className="space-y-2 text-xs text-amber-400/90">
                  <p>
                    {typeof githubResult.reason === "string"
                      ? githubResult.reason
                      : "Configure .env for automatic PR creation."}
                  </p>
                  {typeof githubResult.manual === "object" &&
                    githubResult.manual !== null &&
                    "newFileUrl" in (githubResult.manual as object) && (
                      <a
                        href={(githubResult.manual as { newFileUrl: string }).newFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[var(--accent)] break-all"
                      >
                        Open GitHub editor
                      </a>
                    )}
                </div>
              )}
              {typeof githubResult?.prUrl === "string" && (
                <a
                  href={githubResult.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-[var(--accent)] break-all"
                >
                  {githubResult.prUrl}
                </a>
              )}
              {typeof githubResult?.error === "string" && (
                <p className="text-xs text-rose-400">{githubResult.error}</p>
              )}

              {plan.readiness.warnings.length > 0 && (
                <ul className="text-xs text-amber-400/90">
                  {plan.readiness.warnings.map((w, i) => (
                    <li key={i}>⚠ {w}</li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        )}

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/workshop/research" className="text-[var(--muted)] hover:text-white">
            ← Edit brief
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <SemanticPreview
          ideaTitle={brief.title || session.catalogTitle || "New Idea"}
          ideaBrief={brief}
          tripleDraft={draft as EnrichedTripleDraft | undefined}
          graphContext={session.graphContext}
          showCreateVsSignal
        />
      </div>
    </div>
  );
}
