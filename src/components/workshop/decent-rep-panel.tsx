// src/components/workshop/decent-rep-panel.tsx
"use client";

import { useState } from "react";
import type { WorkshopPublishResult } from "@/lib/intuition/publish-workshop";
import {
  atomExplorerUrl,
  DECENT_REP_PRINCIPLES,
  summarizeOnchainPublish,
  type OnchainPublishSummary,
} from "@/lib/workshop/decent-rep";
import type { OnchainPublishStep, WorkshopPublishPlan } from "@/lib/workshop/publish-plan";
import type { WorkshopSession } from "@/lib/workshop/session";

function stepTone(status: OnchainPublishStep["status"]) {
  if (status === "skip" || status === "exists") return "text-emerald-400/90";
  if (status === "will_create") return "text-[var(--accent)]";
  return "text-[var(--muted)]";
}

interface DecentRepPanelProps {
  session: WorkshopSession;
  plan: WorkshopPublishPlan;
  existingPublish?: OnchainPublishSummary | null;
  onPublished: (summary: OnchainPublishSummary, raw: WorkshopPublishResult) => void;
}

export function DecentRepPanel({
  session,
  plan,
  existingPublish,
  onPublished,
}: DecentRepPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeSupport, setIncludeSupport] = useState(true);
  const published = existingPublish;

  const blocked = plan.publishGuide.publishBlockedReason;
  const canPublish = plan.readiness.onchainReady && !blocked && !published;

  async function publishOnchain() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/workshop/prepare/onchain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session, includeSupportTriples: includeSupport }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "On-chain publish failed");
      return;
    }

    const result = data.result as WorkshopPublishResult;
    onPublished(summarizeOnchainPublish(result), result);
  }

  return (
    <section className="space-y-4 rounded-xl border border-violet-500/30 bg-violet-950/15 p-5">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">Decentralized reputation</h2>
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          Turn your idea into durable graph entries: an <strong className="text-white/80">atom</strong>{" "}
          (the thing), <strong className="text-white/80">triples</strong> (claims linking it to
          Intuition), and vaults others can stake on later. This is the on-chain reputation layer —
          separate from a GitHub PR.
        </p>
      </div>

      <ul className="list-disc space-y-1 pl-4 text-xs text-[var(--muted)]">
        {DECENT_REP_PRINCIPLES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <div className="rounded-lg border border-[var(--border)] bg-black/20 p-3 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-[var(--accent)]">
          Publish plan
        </p>
        <ul className="space-y-1.5 text-xs">
          {plan.onchainSteps.map((step) => (
            <li key={step.id} className={stepTone(step.status)}>
              <span className="font-mono text-[10px] uppercase opacity-70">
                {step.status}
              </span>{" "}
              {step.label}
              {step.detail ? (
                <span className="block pl-14 text-[var(--muted)]">{step.detail}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {published ? (
        <div className="space-y-2 rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3 text-xs">
          <p className="font-medium text-emerald-300/90">Live on {published.network}</p>
          <p className="text-[var(--muted)]">
            Idea atom{" "}
            {published.ideaAtomCreated ? "(created)" : "(reused)"} · Core triple{" "}
            {published.tripleCreated ? "(created)" : "(reused)"}
            {published.supportTripleCount > 0
              ? ` · ${published.supportTripleCount} support triple(s)`
              : ""}
          </p>
          <a
            href={atomExplorerUrl(published.explorerBase, published.ideaAtomId)}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-mono text-[var(--accent)] break-all"
          >
            {published.ideaAtomId}
          </a>
          <a
            href={published.portalHome}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[var(--accent)]"
          >
            Open Intuition portal →
          </a>
        </div>
      ) : blocked ? (
        <p className="text-xs text-amber-400/90">{blocked}</p>
      ) : (
        <>
          <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <input
              type="checkbox"
              checked={includeSupport}
              onChange={(e) => setIncludeSupport(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            Publish support triples on-chain (max 3)
          </label>
          <button
            type="button"
            onClick={() => void publishOnchain()}
            disabled={loading || !canPublish}
            className="w-full rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {loading ? "Publishing on Intuition…" : "Publish atoms & triples on-chain"}
          </button>
        </>
      )}

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </section>
  );
}
