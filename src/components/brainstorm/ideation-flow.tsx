// src/components/brainstorm/ideation-flow.tsx
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { IdeationChallenge } from "@/lib/assist/generate-ideation-challenge";
import type { IdeationSynthesis } from "@/lib/assist/generate-ideation-synthesize";
import type { IdeaFullState } from "@/lib/ideas/idea-state";
import { createFreeIdea } from "@/lib/ideas/free-idea";
import {
  IDEATION_QUESTIONS,
  type IdeationQuestion,
} from "@/lib/ideas/ideation-questions";
import type { IdeationAnswer, IdeationSource } from "@/lib/ideas/ideation-session";
import {
  createSessionId,
  draftStorageKey,
  saveFreeIdea,
  saveIdeationSession,
} from "@/lib/ideas/ideation-session";
import type { PickRefineResponse } from "@/lib/ideas/pick-refinement";
import { normalizeBrainstormDraft } from "@/lib/ideas/publish-plan";
import { synthesisToBrainstormDraft } from "@/lib/ideas/synthesis-to-draft";
import { IdeaCard } from "@/components/brainstorm/idea-card";
import { AtomNameVerificationPanel } from "@/components/brainstorm/atom-name-verification-panel";
import { deriveProjectNameFromIntent } from "@/lib/ideas/verify-atom-by-name";
import { IdeationQuestionCard } from "./ideation-question-card";

type Phase = "intent" | "similar" | "questions" | "synthesis" | "challenge";

export function IdeationFlow() {
  const [phase, setPhase] = useState<Phase>("intent");
  const [intent, setIntent] = useState("");
  const [similar, setSimilar] = useState<PickRefineResponse | null>(null);
  const [source, setSource] = useState<IdeationSource>("free");
  const [catalogSlug, setCatalogSlug] = useState<string | undefined>();
  const [catalogTitle, setCatalogTitle] = useState<string | undefined>();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<IdeationAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [synthesis, setSynthesis] = useState<IdeationSynthesis | null>(null);
  const [challenge, setChallenge] = useState<IdeationChallenge | null>(null);
  const [overlapMessage, setOverlapMessage] = useState<string | undefined>();
  const [appDescription, setAppDescription] = useState("");
  const [headline, setHeadline] = useState("");
  const [workingSlug, setWorkingSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string | null>(null);

  const currentQuestion: IdeationQuestion | undefined =
    IDEATION_QUESTIONS[questionIndex];

  const searchSimilar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brainstorm/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: intent.trim() }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Search failed");
      }
      const data = (await res.json()) as PickRefineResponse;
      setSimilar(data);
      setPhase("similar");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [intent]);

  function chooseCatalog(card: IdeaFullState) {
    setSource("catalog");
    setCatalogSlug(card.slug);
    setCatalogTitle(card.title);
    startQuestions();
  }

  function chooseNew() {
    setSource("free");
    setCatalogSlug(undefined);
    setCatalogTitle(undefined);
    startQuestions();
  }

  function startQuestions() {
    setQuestionIndex(0);
    setAnswers([]);
    setCurrentAnswer("");
    setPhase("questions");
  }

  function persistAnswer(text: string, questionId: string) {
    const trimmed = text.trim();
    if (!trimmed) return answers;
    const next = [...answers.filter((a) => a.questionId !== questionId), {
      questionId,
      text: trimmed,
    }];
    setAnswers(next);
    return next;
  }

  function advanceQuestion(nextAnswers: IdeationAnswer[]) {
    const nextIndex = questionIndex + 1;
    if (nextIndex >= IDEATION_QUESTIONS.length) {
      void runSynthesis(nextAnswers);
      return;
    }
    setQuestionIndex(nextIndex);
    const nextQ = IDEATION_QUESTIONS[nextIndex];
    const existing = nextAnswers.find((a) => a.questionId === nextQ.id);
    setCurrentAnswer(existing?.text ?? "");
  }

  function handleContinueQuestion() {
    if (!currentQuestion) return;
    const nextAnswers = persistAnswer(currentAnswer, currentQuestion.id);
    advanceQuestion(nextAnswers);
  }

  function handleSkipQuestion() {
    if (!currentQuestion?.optional) return;
    advanceQuestion(answers);
  }

  async function runSynthesis(finalAnswers: IdeationAnswer[]) {
    setLoading(true);
    setError(null);
    setPhase("synthesis");
    try {
      const res = await fetch("/api/brainstorm/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: intent.trim(),
          source,
          catalogSlug,
          answers: finalAnswers,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Synthesis failed");
      }
      const data = (await res.json()) as {
        synthesis: IdeationSynthesis;
        source: string;
        assistError?: string;
        overlapMessage?: string;
      };
      setSynthesis(data.synthesis);
      setAppDescription(data.synthesis.appDescription);
      setHeadline(data.synthesis.headline);
      setOverlapMessage(data.overlapMessage);
      setAiSource(data.source === "openai" ? "AI" : "local fallback");
      if (data.assistError) setError(data.assistError);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setPhase("questions");
    } finally {
      setLoading(false);
    }
  }

  async function runChallenge() {
    if (!synthesis) return;
    setLoading(true);
    setError(null);
    setPhase("challenge");
    try {
      const res = await fetch("/api/brainstorm/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: intent.trim(),
          headline,
          appDescription,
          intuitionFit: synthesis.intuitionFit,
          mvp: synthesis.mvp,
          risks: synthesis.risks,
          overlapMessage,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Challenge failed");
      }
      const data = (await res.json()) as {
        challenge: IdeationChallenge;
        source: string;
        assistError?: string;
      };
      setChallenge(data.challenge);
      setAiSource(data.source === "openai" ? "AI" : "local fallback");
      if (data.assistError) setError(data.assistError);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setPhase("synthesis");
    } finally {
      setLoading(false);
    }
  }

  function finalizeAndPrepare() {
    if (!synthesis) return;

    let slug: string;
    if (source === "catalog" && catalogSlug) {
      slug = catalogSlug;
    } else {
      const idea = createFreeIdea({
        intent: intent.trim(),
        title: headline || intent.slice(0, 48),
        description: appDescription,
      });
      slug = idea.slug;
      saveFreeIdea(idea);
    }

    const draft = synthesisToBrainstormDraft(
      { ...synthesis, appDescription },
      intent.trim(),
      challenge,
    );
    const usersAnswer = answers.find((a) => a.questionId === "users")?.text;
    if (usersAnswer) draft.users = usersAnswer;

    localStorage.setItem(
      draftStorageKey(slug),
      JSON.stringify(normalizeBrainstormDraft(draft)),
    );

    saveIdeationSession({
      id: createSessionId(),
      intent: intent.trim(),
      source,
      catalogSlug,
      catalogTitle,
      freeSlug: source === "free" ? slug : undefined,
      answers,
      synthesis: {
        headline,
        reflection: synthesis.reflection,
        perspectives: synthesis.perspectives,
        appDescription,
      },
      createdAt: new Date().toISOString(),
    });

    setWorkingSlug(slug);
    window.location.href = `/brainstorm/idea/${slug}#publication`;
  }

  function resetAll() {
    setPhase("intent");
    setIntent("");
    setSimilar(null);
    setSource("free");
    setCatalogSlug(undefined);
    setCatalogTitle(undefined);
    setQuestionIndex(0);
    setAnswers([]);
    setCurrentAnswer("");
    setSynthesis(null);
    setChallenge(null);
    setOverlapMessage(undefined);
    setAppDescription("");
    setHeadline("");
    setWorkingSlug(null);
    setError(null);
    setAiSource(null);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Brainstorm · guided ideation</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Describe your idea, browse the catalog for inspiration, then answer a few
          questions to expand your concept before Prepare.
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {phase === "intent" && "Step 1 · Describe"}
          {phase === "similar" && "Step 2 · Similar ideas"}
          {phase === "questions" && `Step 3 · Questions (${questionIndex + 1}/${IDEATION_QUESTIONS.length})`}
          {phase === "synthesis" && "Step 4 · Synthesis"}
          {phase === "challenge" && "Step 5 · Challenge"}
        </p>
      </div>

      {error ? (
        <p className="text-sm text-amber-400">{error}</p>
      ) : null}

      {phase === "intent" ? (
        <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <label className="block">
            <span className="text-sm font-semibold">Your idea</span>
            <textarea
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-sm focus:border-[var(--accent)] focus:outline-none"
              rows={4}
              placeholder="E.g. a GPS app that tells the cultural history of places, or a community-voted ranking of AI agents…"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={loading || intent.trim().length < 10}
            onClick={() => void searchSimilar()}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-black transition hover:bg-white disabled:opacity-40"
          >
            {loading ? "Searching…" : "Find similar ideas"}
          </button>
        </section>
      ) : null}

      {phase === "similar" && similar ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
            <span>
              {similar.matchCount} similar idea
              {similar.matchCount !== 1 ? "s" : ""} in the catalog
            </span>
            <button
              type="button"
              onClick={resetAll}
              className="text-[var(--accent)] hover:underline"
            >
              Start over
            </button>
          </div>

          <p className="text-sm text-[var(--muted)]">
            Your intent: <em className="text-white/80">{intent}</em>
          </p>

          <AtomNameVerificationPanel
            projectName={deriveProjectNameFromIntent(intent)}
            compact
          />

          {similar.cards.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">
                Does one of these ideas inspire you?
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {similar.cards.map((card) => (
                  <IdeaCard
                    key={card.slug}
                    state={card}
                    selected={catalogSlug === card.slug}
                    onSelect={() => chooseCatalog(card)}
                  />
                ))}
              </div>
            </section>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              No close match — you can start from scratch.
            </p>
          )}

          <section className="rounded-xl border border-dashed border-[var(--accent)]/50 bg-[var(--card)] p-5">
            <h3 className="font-semibold">Create a new idea</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Keep your original wording and run ideation on it.
            </p>
            <button
              type="button"
              onClick={chooseNew}
              className="mt-4 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-black transition hover:bg-white"
            >
              Start from my idea →
            </button>
          </section>
        </>
      ) : null}

      {phase === "questions" && currentQuestion ? (
        <>
          <p className="text-sm text-[var(--muted)]">
            {source === "catalog" && catalogTitle
              ? `Catalog anchor: « ${catalogTitle} » — your intent stays primary.`
              : "New idea from your description."}
          </p>
          <IdeationQuestionCard
            question={currentQuestion}
            step={questionIndex + 1}
            total={IDEATION_QUESTIONS.length}
            value={currentAnswer}
            onChange={setCurrentAnswer}
            onContinue={handleContinueQuestion}
            onSkip={currentQuestion.optional ? handleSkipQuestion : undefined}
            disabled={loading}
          />
          <button
            type="button"
            onClick={resetAll}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Recommencer
          </button>
        </>
      ) : null}

      {phase === "synthesis" ? (
        loading || !synthesis ? (
          <p className="text-[var(--muted)]">Synthesizing…</p>
        ) : (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
              <span>Synthesis {aiSource ? `(${aiSource})` : ""}</span>
              <button
                type="button"
                onClick={resetAll}
                className="text-[var(--accent)] hover:underline"
              >
                Start over
              </button>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">Name / tagline</span>
              <input
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </label>

            <AtomNameVerificationPanel
              projectName={deriveProjectNameFromIntent(intent, headline || synthesis.headline)}
            />

            {overlapMessage ? (
              <p className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-xs text-[var(--muted)]">
                <strong className="text-white/80">Ecosystem: </strong>
                {overlapMessage}
              </p>
            ) : null}

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm font-semibold text-[var(--accent)]">
                Expanded reflection
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)] whitespace-pre-wrap">
                {synthesis.reflection}
              </p>
            </div>

            {synthesis.perspectives.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold">Perspectives to explore</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                  {synthesis.perspectives.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-semibold">
                My app description (editable)
              </span>
              <textarea
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-sm focus:border-[var(--accent)] focus:outline-none"
                rows={6}
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="rounded-lg border border-[var(--border)] p-4">
                <p className="text-xs text-[var(--muted)]">Intuition</p>
                <p className="mt-1 text-[var(--muted)]">{synthesis.intuitionFit}</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-4">
                <p className="text-xs text-[var(--muted)]">MVP</p>
                <p className="mt-1 text-[var(--muted)]">{synthesis.mvp}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void runChallenge()}
                disabled={appDescription.trim().length < 20 || loading}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-black transition hover:bg-white disabled:opacity-40"
              >
                Challenge my idea →
              </button>
              <button
                type="button"
                onClick={finalizeAndPrepare}
                disabled={appDescription.trim().length < 20}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
              >
                Skip to Prepare
              </button>
            </div>
          </section>
        )
      ) : null}

      {phase === "challenge" ? (
        loading || !challenge ? (
          <p className="text-[var(--muted)]">Running stress test…</p>
        ) : (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
              <span>Challenge {aiSource ? `(${aiSource})` : ""}</span>
              <button
                type="button"
                onClick={() => setPhase("synthesis")}
                className="text-[var(--accent)] hover:underline"
              >
                Back to synthesis
              </button>
            </div>

            <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-5">
              <h3 className="text-sm font-semibold text-amber-300">
                Main objection
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {challenge.mainObjection}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--card)] p-5">
              <h3 className="text-sm font-semibold text-[var(--accent)]">
                What if… (counter-direction)
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {challenge.counterDirection}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[var(--border)] p-4">
                <h3 className="text-sm font-semibold">Killer assumptions</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                  {challenge.killerAssumptions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-4">
                <h3 className="text-sm font-semibold">Open questions</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                  {challenge.openQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--muted)]">
              <strong className="text-white/85">Verdict: </strong>
              {challenge.verdict}
            </p>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">
                My app description (adjustable after challenge)
              </span>
              <textarea
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-sm focus:border-[var(--accent)] focus:outline-none"
                rows={6}
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={finalizeAndPrepare}
                disabled={appDescription.trim().length < 20}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-black transition hover:bg-white disabled:opacity-40"
              >
                Continue to publication →
              </button>
              {workingSlug ? (
                <Link
                  href={`/brainstorm/idea/${workingSlug}#publication`}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
                >
                  Publish
                </Link>
              ) : null}
            </div>
          </section>
        )
      ) : null}
    </div>
  );
}
