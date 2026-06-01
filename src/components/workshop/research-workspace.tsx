// src/components/workshop/research-workspace.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_IDEA_BRIEF,
  normalizeIdeaBrief,
  type IdeaBrief,
} from "@/lib/workshop/idea-brief";
import type { BrainstormDirection, BrainstormReport } from "@/lib/workshop/brainstorm";
import { directionToRefinedIntent } from "@/lib/workshop/brainstorm";
import type { DeepResearchReport } from "@/lib/workshop/idea-research";
import { RESEARCH_SECTIONS } from "@/lib/workshop/idea-research";
import { loadSession, saveSession, type WorkshopSession } from "@/lib/workshop/session";
import { BrainstormDirectionsPanel } from "./brainstorm-directions-panel";
import { IdeaBriefSheetCard } from "./idea-brief-sheet-card";

type Phase = "brainstorm" | "deepen";

export function ResearchWorkspace() {
  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [exploration, setExploration] = useState("");
  const [phase, setPhase] = useState<Phase>("brainstorm");
  const [brainstorm, setBrainstorm] = useState<BrainstormReport | null>(null);
  const [report, setReport] = useState<DeepResearchReport | null>(null);
  const [brief, setBrief] = useState<IdeaBrief>(EMPTY_IDEA_BRIEF);
  const [brainstormLoading, setBrainstormLoading] = useState(false);
  const [deepenLoading, setDeepenLoading] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [assistError, setAssistError] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [briefFinalizedAt, setBriefFinalizedAt] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadSession();
    if (!stored?.rawIntent?.trim()) {
      setSession(null);
      return;
    }
    setSession(stored);
    setExploration(stored.explorationPrompt ?? stored.rawIntent);
    if (stored.brainstorm) setBrainstorm(stored.brainstorm);
    if (stored.selectedDirectionId) setSelectedId(stored.selectedDirectionId);
    if (stored.briefFinalizedAt) setBriefFinalizedAt(stored.briefFinalizedAt);
    if (stored.deepResearch && stored.selectedDirection) {
      setPhase("deepen");
      setReport(stored.deepResearch);
      setBrief(stored.ideaBrief ?? stored.deepResearch.proposedBrief);
    } else if (stored.brainstorm) {
      setPhase("brainstorm");
    }
  }, []);

  const runBrainstorm = useCallback(async () => {
    if (!session || exploration.trim().length < 10) {
      setError("Describe what you want to explore in at least 10 characters.");
      return;
    }
    setError(null);
    setBrainstormLoading(true);
    const base: WorkshopSession = {
      ...session,
      rawIntent: exploration.trim(),
      explorationPrompt: exploration.trim(),
      selectedDirection: undefined,
      selectedDirectionId: undefined,
      deepResearch: undefined,
      ideaBrief: undefined,
      tripleDraft: undefined,
      briefFinalizedAt: undefined,
    };
    const res = await fetch("/api/assist/brainstorm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: exploration.trim(), session: base }),
    });
    const data = await res.json();
    setBrainstormLoading(false);
    if (data.error) {
      setError(data.error);
      return;
    }
    if (data.report) {
      const b = data.report as BrainstormReport;
      setBrainstorm(b);
      setPhase("brainstorm");
      setReport(null);
      setSelectedId(null);
      const saved: WorkshopSession = {
        ...base,
        brainstorm: b,
        graphContext: data.graphContext,
      };
      saveSession(saved);
      setSession(saved);
      setSource(data.source as string);
      setAssistError(typeof data.assistError === "string" ? data.assistError : null);
      setModelUsed(typeof data.modelUsed === "string" ? data.modelUsed : null);
    }
  }, [session, exploration]);

  useEffect(() => {
    if (!session) return;
    if (phase === "deepen" && report) return;
    if (brainstorm) return;
    if (exploration.trim().length < 10) return;
    const t = setTimeout(() => void runBrainstorm(), 400);
    return () => clearTimeout(t);
  }, [session?.id, brainstorm, phase, report, exploration, runBrainstorm]);

  async function developDirection(direction: BrainstormDirection) {
    if (!session) return;
    setSelectedId(direction.id);
    setDeepenLoading(true);
    setError(null);

    const refined = directionToRefinedIntent(exploration.trim(), direction);
    const base: WorkshopSession = {
      ...session,
      rawIntent: refined,
      explorationPrompt: exploration.trim(),
      selectedDirection: direction,
      selectedDirectionId: direction.id,
      deepResearch: undefined,
      ideaBrief: undefined,
      tripleDraft: undefined,
      briefFinalizedAt: undefined,
    };

    const res = await fetch("/api/assist/idea-research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: base }),
    });
    const data = await res.json();
    setDeepenLoading(false);

    if (data.error) {
      setError(data.error);
      return;
    }
    if (data.report) {
      const r = data.report as DeepResearchReport;
      setReport(r);
      setBrief(r.proposedBrief);
      setPhase("deepen");
      setSource(data.source as string);
      setAssistError(typeof data.assistError === "string" ? data.assistError : null);
      setModelUsed(typeof data.modelUsed === "string" ? data.modelUsed : null);
      const saved: WorkshopSession = {
        ...base,
        deepResearch: r,
        ideaBrief: r.proposedBrief,
        graphContext: data.graphContext ?? base.graphContext,
      };
      saveSession(saved);
      setSession(saved);
    }
  }

  function handleBriefChange(next: IdeaBrief) {
    setBrief(next);
    if (session) saveSession({ ...session, ideaBrief: next });
  }

  function handleBriefFinalized(next: IdeaBrief, finalizedAt: string) {
    setBrief(next);
    setBriefFinalizedAt(finalizedAt);
    if (session) {
      const saved = { ...session, ideaBrief: next, briefFinalizedAt: finalizedAt };
      saveSession(saved);
      setSession(saved);
    }
  }

  function goToPrepare() {
    if (!session || !briefFinalizedAt) return;
    const normalizedBrief = normalizeIdeaBrief(brief, brief.title, exploration.trim());
    saveSession({
      ...session,
      ideaBrief: normalizedBrief,
      briefFinalizedAt,
      tripleDraft: undefined,
    });
    window.location.href = "/workshop/prepare";
  }

  function backToBrainstorm() {
    setPhase("brainstorm");
    setReport(null);
    setBriefFinalizedAt(null);
    if (session) {
      const saved = {
        ...session,
        deepResearch: undefined,
        ideaBrief: undefined,
        selectedDirection: undefined,
        selectedDirectionId: undefined,
        briefFinalizedAt: undefined,
      };
      saveSession(saved);
      setSession(saved);
      setSelectedId(null);
    }
  }

  if (!session?.rawIntent && !exploration) {
    return (
      <div className="rounded-xl border border-[var(--border)] p-6">
        <p className="text-[var(--muted)]">Empty session.</p>
        <Link href="/workshop" className="mt-4 inline-block text-[var(--accent)]">
          New idea
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
          {phase === "brainstorm" ? "Step 1 · Brainstorm" : "Step 2 · Deep research"}
        </p>
        <h1 className="text-2xl font-bold">
          {phase === "brainstorm"
            ? "Explore and shape your idea"
            : session?.selectedDirection?.title ?? "Develop your direction"}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {phase === "brainstorm"
            ? "No fixed product required — we propose coherent directions, you pick one to deepen."
            : "Full diagnostic, improvements, and downloadable brief for the direction you chose."}
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <label className="block space-y-1">
          <span className="text-xs font-medium">What do you want to explore?</span>
          <textarea
            value={exploration}
            onChange={(e) => setExploration(e.target.value)}
            rows={4}
            disabled={phase === "deepen" && deepenLoading}
            className="w-full rounded-xl border border-[var(--border)] bg-neutral-950 px-4 py-3 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-60"
            placeholder="e.g. I'm drawn to cinema and culture but don't have a precise app yet — interested in trust, discovery, and community…"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void runBrainstorm()}
            disabled={brainstormLoading || exploration.trim().length < 10}
            className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black disabled:opacity-40"
          >
            {brainstormLoading ? "Brainstorming…" : brainstorm ? "Re-run brainstorm" : "Brainstorm directions"}
          </button>
          {phase === "deepen" && (
            <button
              type="button"
              onClick={backToBrainstorm}
              className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm"
            >
              ← Pick another direction
            </button>
          )}
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        {source && (
          <p className="text-[10px] text-[var(--muted)]">
            Analysis: {source}
            {modelUsed ? ` · ${modelUsed}` : ""}
          </p>
        )}
        {source === "fallback" && assistError && (
          <p className="text-xs text-amber-400/90 rounded-lg border border-amber-900/40 bg-amber-950/20 p-3">
            AI response could not be parsed ({assistError}). Showing local brainstorm/research.
          </p>
        )}
      </section>

      {brainstormLoading && !brainstorm && (
        <p className="text-sm text-[var(--muted)] animate-pulse">
          Exploring catalog, graph, and drafting directions…
        </p>
      )}

      {phase === "brainstorm" && brainstorm && (
        <BrainstormDirectionsPanel
          report={brainstorm}
          selectedId={selectedId}
          onSelect={(d) => void developDirection(d)}
          loadingDeepen={deepenLoading}
        />
      )}

      {phase === "deepen" && report && session?.selectedDirection && (
        <>
          <section className="rounded-xl border border-[var(--accent)]/30 bg-[var(--card)] p-4 text-sm">
            <p className="text-[10px] uppercase text-[var(--accent)]">Chosen direction</p>
            <p className="font-semibold">{session.selectedDirection.title}</p>
            <p className="text-xs text-[var(--muted)] mt-1">{session.selectedDirection.tagline}</p>
          </section>

          <p className="text-lg font-medium text-center text-white/95">{report.headline}</p>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-black">
                1
              </span>
              {RESEARCH_SECTIONS[0]!.title}
            </h2>
            {report.similarIdeas.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No very close ideas detected.</p>
            ) : (
              <ul className="space-y-2">
                {report.similarIdeas.map((hit, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
                  >
                    <div className="flex flex-wrap gap-2 items-baseline">
                      {hit.url || hit.slug ? (
                        <a
                          href={hit.url ?? `/ideas/${hit.slug}`}
                          className="text-sm font-medium text-[var(--accent)] hover:underline"
                          {...(hit.url?.startsWith("http")
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        >
                          {hit.title}
                        </a>
                      ) : (
                        <span className="text-sm font-medium">{hit.title}</span>
                      )}
                      <span className="text-[10px] uppercase text-[var(--muted)]">
                        {hit.source}
                      </span>
                    </div>
                    {hit.tagline && (
                      <p className="text-xs text-[var(--muted)] mt-1">{hit.tagline}</p>
                    )}
                    <p className="text-xs text-[var(--muted)] mt-1">{hit.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-black">
                2
              </span>
              {RESEARCH_SECTIONS[1]!.title}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--muted)] whitespace-pre-wrap">
              {report.diagnostic.summary}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-emerald-400/90 mb-2">Strengths</p>
                <ul className="text-sm text-[var(--muted)] space-y-1 list-disc pl-4">
                  {report.diagnostic.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-amber-400/90 mb-2">Weaknesses</p>
                <ul className="text-sm text-[var(--muted)] space-y-1 list-disc pl-4">
                  {report.diagnostic.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-black">
                3
              </span>
              {RESEARCH_SECTIONS[2]!.title}
            </h2>
            <ul className="space-y-2">
              {report.improvements.map((imp, i) => (
                <li key={i} className="text-sm border-l-2 border-[var(--accent)]/50 pl-3">
                  <span className="text-[10px] uppercase text-[var(--accent)]">
                    {imp.framework}
                  </span>
                  <p className="text-[var(--muted)] mt-0.5 leading-relaxed">{imp.suggestion}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-black">
                4
              </span>
              {RESEARCH_SECTIONS[3]!.title}
            </h2>
            <ul className="space-y-3">
              {report.relatedIdeas.map((rel, i) => (
                <li key={i} className="rounded-lg bg-neutral-950 p-3">
                  <p className="font-medium text-sm">{rel.title}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">{rel.pitch}</p>
                  <p className="text-[10px] text-[var(--accent)] mt-1">{rel.angle}</p>
                </li>
              ))}
            </ul>
          </section>

          <IdeaBriefSheetCard
            brief={brief}
            finalizedAt={briefFinalizedAt}
            sessionId={session.id}
            rawIntent={exploration.trim()}
            researchHeadline={report.headline}
            onBriefChange={handleBriefChange}
            onFinalized={handleBriefFinalized}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={goToPrepare}
              disabled={!briefFinalizedAt}
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black disabled:opacity-40"
            >
              Continue → decentralized reputation
            </button>
            <Link href="/workshop" className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm">
              ← Edit exploration
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
