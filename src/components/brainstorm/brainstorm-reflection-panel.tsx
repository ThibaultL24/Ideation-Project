// src/components/brainstorm/brainstorm-reflection-panel.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Idea } from "@/lib/ideas/schema";
import type { IdeaReflectionReport } from "@/lib/ideas/idea-reflection";
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import { reflectionToBrainstormDraft } from "@/lib/ideas/reflection-to-draft";

interface BrainstormReflectionPanelProps {
  idea: Idea;
  draftStorageKey: string;
  onDraftApplied: (draft: BrainstormDraft) => void;
}

export function BrainstormReflectionPanel({
  idea,
  draftStorageKey,
  onDraftApplied,
}: BrainstormReflectionPanelProps) {
  const router = useRouter();
  const [report, setReport] = useState<IdeaReflectionReport | null>(null);
  const [source, setSource] = useState<"openai" | "fallback" | null>(null);
  const [assistError, setAssistError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [userAngle, setUserAngle] = useState("");

  const runReflection = useCallback(async (angle: string) => {
    setLoading(true);
    setAssistError(undefined);
    try {
      const res = await fetch("/api/brainstorm/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: idea.slug,
          userAngle: angle.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        report?: IdeaReflectionReport;
        source?: "openai" | "fallback";
        assistError?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Reflection failed");
      if (data.report) {
        setReport(data.report);
        setSource(data.source ?? null);
        setAssistError(data.assistError);
      }
    } catch (error) {
      setAssistError(error instanceof Error ? error.message : "Unknown error");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [idea.slug]);

  useEffect(() => {
    void runReflection("");
  }, [idea.slug, runReflection]);

  function applyDraft(goToPrepare: boolean) {
    if (!report) return;
    const draft = reflectionToBrainstormDraft(report);
    localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    onDraftApplied(draft);
    if (goToPrepare) router.push(`/prepare/${idea.slug}`);
  }

  return (
    <section className="space-y-5 rounded-xl border border-teal-500/25 bg-teal-950/10 p-5">
      <div>
        <h2 className="text-sm font-semibold">Réflexion sur cette idée</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Analyse convergente de <strong className="text-white/85">{idea.title}</strong>{" "}
          — pas de variantes, pas de quiz. L&apos;IA commente l&apos;idée que vous avez
          sélectionnée.
        </p>
      </div>

      <label className="block text-sm">
        <span className="text-[var(--muted)]">Votre angle (optionnel)</span>
        <textarea
          className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm"
          rows={2}
          placeholder="Ex. : version pour les musées locaux, pas les touristes"
          value={userAngle}
          onChange={(e) => setUserAngle(e.target.value)}
        />
      </label>

      <button
        type="button"
        disabled={loading}
        onClick={() => void runReflection(userAngle)}
        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)] disabled:opacity-50"
      >
        {loading ? "Réflexion en cours…" : "Relancer la réflexion"}
      </button>

      {source && (
        <p className="text-xs text-[var(--muted)]">
          Source : {source === "openai" ? "OpenAI" : "fallback local"}
          {assistError ? ` · ${assistError}` : ""}
        </p>
      )}

      {loading && !report ? (
        <p className="text-sm text-[var(--muted)]">Lecture du catalogue, graphe et GitHub…</p>
      ) : null}

      {report && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
            <p className="text-lg font-semibold">{report.headline}</p>
            <p className="text-sm leading-relaxed text-[var(--muted)] whitespace-pre-wrap">
              {report.reflection}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-xs font-medium text-emerald-400">Forces</h3>
              <ul className="mt-2 list-disc pl-4 text-sm text-[var(--muted)] space-y-1">
                {report.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-xs font-medium text-amber-400">Faiblesses</h3>
              <ul className="mt-2 list-disc pl-4 text-sm text-[var(--muted)] space-y-1">
                {report.weaknesses.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted)]">
            <h3 className="text-xs font-medium text-[var(--accent)]">Écosystème</h3>
            <p className="mt-2">{report.ecosystemNote}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => applyDraft(false)}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-black transition hover:bg-white"
            >
              Appliquer au brouillon
            </button>
            <button
              type="button"
              onClick={() => applyDraft(true)}
              className="rounded-lg border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)]"
            >
              Appliquer → Prepare
            </button>
            <Link
              href={`/prepare/${idea.slug}`}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
            >
              Prepare sans appliquer
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
