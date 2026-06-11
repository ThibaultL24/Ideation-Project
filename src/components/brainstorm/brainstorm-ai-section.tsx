// src/components/brainstorm/brainstorm-ai-section.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Idea } from "@/lib/ideas/schema";
import {
  directionToBrainstormDraft,
  mergeDraftWithSeed,
} from "@/lib/ideas/direction-to-draft";
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import type { BrainstormDirection, BrainstormReport } from "@/lib/workshop/brainstorm";
import { BrainstormDirectionsPanel } from "@/components/workshop/brainstorm-directions-panel";

interface BrainstormAiSectionProps {
  idea: Idea;
  draftStorageKey: string;
  onDraftApplied: (draft: BrainstormDraft) => void;
}

export function BrainstormAiSection({
  idea,
  draftStorageKey,
  onDraftApplied,
}: BrainstormAiSectionProps) {
  const router = useRouter();
  const [report, setReport] = useState<BrainstormReport | null>(null);
  const [source, setSource] = useState<"openai" | "fallback" | null>(null);
  const [assistError, setAssistError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"deepen" | "prepare" | null>(null);
  const [extraPrompt, setExtraPrompt] = useState("");

  async function runAssist() {
    setLoading(true);
    setAssistError(undefined);
    try {
      const res = await fetch("/api/brainstorm/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: idea.slug,
          prompt: extraPrompt.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        report?: BrainstormReport;
        source?: "openai" | "fallback";
        assistError?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Brainstorm failed");
      if (data.report) {
        setReport(data.report);
        setSource(data.source ?? null);
        setAssistError(data.assistError);
        setSelectedId(data.report.recommendedDirectionId ?? data.report.directions[0]?.id ?? null);
      }
    } catch (error) {
      setAssistError(error instanceof Error ? error.message : "Unknown error");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  function applyDirection(direction: BrainstormDirection, goToPrepare: boolean) {
    const next = mergeDraftWithSeed(
      directionToBrainstormDraft(direction, idea.description),
      idea.description,
    );
    localStorage.setItem(draftStorageKey, JSON.stringify(next));
    onDraftApplied(next);
    if (goToPrepare) router.push(`/prepare/${idea.slug}`);
  }

  return (
    <section className="space-y-4 rounded-xl border border-violet-500/25 bg-violet-950/10 p-5">
      <div>
        <h2 className="text-sm font-semibold">Brainstorm assisté (IA)</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Génère 5 directions à partir du catalogue, du graphe Intuition et des discussions
          GitHub — puis applique une direction au brouillon bounty.
        </p>
      </div>

      <label className="block text-sm">
        <span className="text-[var(--muted)]">Angle optionnel (10+ caractères)</span>
        <textarea
          className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm"
          rows={2}
          placeholder="Ex. : version mobile pour créateurs, avec staking sur la qualité des reviews"
          value={extraPrompt}
          onChange={(e) => setExtraPrompt(e.target.value)}
        />
      </label>

      <button
        type="button"
        disabled={loading}
        onClick={() => void runAssist()}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        {loading ? "Génération…" : "Générer 5 directions"}
      </button>

      {source && (
        <p className="text-xs text-[var(--muted)]">
          Source : {source === "openai" ? "OpenAI" : "fallback local"}
          {assistError ? ` · ${assistError}` : ""}
        </p>
      )}

      {report && (
        <BrainstormDirectionsPanel
          report={report}
          selectedId={selectedId}
          loadingAction={loadingAction}
          onDeepen={(direction) => {
            setSelectedId(direction.id);
            setLoadingAction("deepen");
            applyDirection(direction, false);
            setLoadingAction(null);
          }}
          onPrepare={(direction) => {
            setSelectedId(direction.id);
            setLoadingAction("prepare");
            applyDirection(direction, true);
            setLoadingAction(null);
          }}
        />
      )}
    </section>
  );
}
