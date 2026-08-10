// src/components/brainstorm/brainstorm-workspace.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrainstormReflectionPanel } from "@/components/brainstorm/brainstorm-reflection-panel";
import { IdeationActionsPanel } from "@/components/brainstorm/ideation-actions-panel";
import { IdeaStatePanel } from "@/components/brainstorm/idea-state-panel";
import { PublishTabNav } from "@/components/brainstorm/publish-tab-nav";
import type { IdeaFullState } from "@/lib/ideas/idea-state";
import type { Idea } from "@/lib/ideas/schema";
import {
  DEFAULT_BRAINSTORM_DRAFT,
  buildPublishPlan,
  normalizeBrainstormDraft,
  type BrainstormArchetype,
  type BrainstormDraft,
} from "@/lib/ideas/publish-plan";
import { workspaceStrings as ws } from "@/lib/strings/brainstorm-workspace";
import { BrainstormPublishSection } from "./brainstorm-publish-section";

type WorkspaceTab = "draft" | "publish";

const WORKSPACE_TABS: ReadonlyArray<{ id: WorkspaceTab; label: string }> = [
  { id: "draft", label: ws.draftTab },
  { id: "publish", label: ws.publishTab },
];

const SECTION_KEYS = [
  "problem",
  "solution",
  "users",
  "intuitionFit",
  "mvp",
  "risks",
  "challenge",
  "supportTriples",
] as const;

type DraftKey = (typeof SECTION_KEYS)[number];

const ARCHETYPE_IDS: BrainstormArchetype[] = [
  "curated-list",
  "reputation",
  "social-attestation",
  "risk-detection",
  "prediction-signal",
  "agent-memory",
];

function storageKey(slug: string) {
  return `brainstorm-draft:${slug}`;
}

interface BrainstormWorkspaceProps {
  idea: Idea;
}

export function BrainstormWorkspace({ idea }: BrainstormWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("draft");
  const [draft, setDraft] = useState<BrainstormDraft>(DEFAULT_BRAINSTORM_DRAFT);
  const [saved, setSaved] = useState(false);
  const [fullState, setFullState] = useState<IdeaFullState | null>(null);
  const [statePrompt, setStatePrompt] = useState("");
  const [loadingState, setLoadingState] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey(idea.slug));
    if (!raw) {
      setDraft({
        ...DEFAULT_BRAINSTORM_DRAFT,
        problem: idea.description.slice(0, 500),
      });
      return;
    }
    try {
      setDraft(normalizeBrainstormDraft(JSON.parse(raw) as Partial<BrainstormDraft>));
    } catch {
      /* ignore */
    }
  }, [idea.slug, idea.description]);

  useEffect(() => {
    void (async () => {
      setLoadingState(true);
      try {
        const res = await fetch(
          `/api/idea-state/${encodeURIComponent(idea.slug)}?verifyOnchain=true`,
        );
        if (res.ok) {
          const data = (await res.json()) as { state: IdeaFullState; prompt: string };
          setFullState(data.state);
          setStatePrompt(data.prompt);
        }
      } finally {
        setLoadingState(false);
      }
    })();
  }, [idea.slug]);

  function updateField(id: DraftKey, value: string) {
    setDraft((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  }

  function updateArchetype(archetype: BrainstormArchetype) {
    setDraft((prev) => ({ ...prev, archetype }));
    setSaved(false);
  }

  function saveDraft() {
    localStorage.setItem(storageKey(idea.slug), JSON.stringify(draft));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const plan = buildPublishPlan(idea, draft);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="neon-kicker text-[10px] font-semibold uppercase">{ws.kicker}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{idea.title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{idea.tagline}</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">{ws.pageLead}</p>
        </div>
        {activeTab === "draft" ? (
          <button
            type="button"
            onClick={() => setActiveTab("publish")}
            className="neon-btn shrink-0 rounded-lg px-4 py-2 text-sm font-medium"
          >
            {ws.preparePublish} →
          </button>
        ) : null}
      </div>

      {activeTab === "draft" ? (
        <section className="neon-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold">{ws.howItWorksTitle}</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {ws.howItWorks.map((item) => (
              <li key={item.step} className="neon-card rounded-xl p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cyan)]">
                  Step {item.step}
                </p>
                <p className="mt-1 text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{item.text}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <PublishTabNav tabs={WORKSPACE_TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === "draft" ? (
        <>
          {fullState ? (
            <section className="space-y-2">
              <div>
                <h2 className="text-sm font-semibold">{ws.statusTitle}</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">{ws.statusLead}</p>
              </div>
              <IdeaStatePanel
                state={fullState}
                prompt={statePrompt}
                loadingOnchain={loadingState}
                compact
              />
            </section>
          ) : null}

          <section className="space-y-2">
            <h2 className="neon-kicker text-[10px] font-semibold uppercase">
              {ws.reflectionStep}
            </h2>
            <BrainstormReflectionPanel
              idea={idea}
              draftStorageKey={storageKey(idea.slug)}
              onDraftApplied={(next) => {
                setDraft(next);
                setSaved(false);
              }}
            />
          </section>

          <section className="space-y-2">
            <h2 className="neon-kicker text-[10px] font-semibold uppercase">
              {ws.workshopStep}
            </h2>
            <IdeationActionsPanel
              idea={idea}
              draft={draft}
              onDraftChange={(next) => {
                setDraft(next);
                setSaved(false);
              }}
              onContinuePublish={() => setActiveTab("publish")}
            />
          </section>

          <section className="space-y-5 border-t border-[var(--border)] pt-8">
            <div>
              <h2 className="neon-kicker text-[10px] font-semibold uppercase">
                {ws.draftStep}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{ws.draftStepLead}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{ws.refineHint}</p>
            </div>

            <section className="neon-panel rounded-2xl p-5">
              <h3 className="text-sm font-semibold">{ws.archetypeTitle}</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">{ws.archetypeLead}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {ARCHETYPE_IDS.map((id) => {
                  const item = ws.archetypes[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updateArchetype(id)}
                      className={`neon-card rounded-xl p-3 text-left text-sm ${
                        draft.archetype === id ? "neon-card-active" : ""
                      }`}
                    >
                      <span className="block font-medium">{item.label}</span>
                      <span className="mt-1 block text-xs text-[var(--muted)]">
                        {item.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="space-y-6">
              {SECTION_KEYS.map((sectionId) => {
                const section = ws.sections[sectionId];
                return (
                  <label key={sectionId} className="block">
                    <span className="text-sm font-semibold">{section.label}</span>
                    <textarea
                      className="neon-input mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--foreground)]"
                      rows={sectionId === "supportTriples" ? 3 : 4}
                      placeholder={section.placeholder}
                      value={draft[sectionId]}
                      onChange={(e) => updateField(sectionId, e.target.value)}
                    />
                  </label>
                );
              })}
            </div>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="neon-card rounded-2xl p-5">
                <h3 className="font-semibold">{ws.semanticLinter}</h3>
                {plan.readiness.warnings.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--cyan-bright)]">{ws.draftReady}</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm text-amber-200">
                    {plan.readiness.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="neon-card rounded-2xl p-5">
                <h3 className="font-semibold">{ws.coreTriple}</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">{ws.coreTripleLead}</p>
                <p className="mt-3 rounded-lg border border-[rgba(78,234,213,0.2)] bg-[rgba(78,234,213,0.05)] p-3 font-mono text-xs text-[var(--cyan-bright)]">
                  {plan.coreTriple.join(" - ")}
                </p>
              </div>
            </section>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveDraft}
                className="neon-btn-ghost rounded-lg px-4 py-2 text-sm"
              >
                {saved ? ws.saved : ws.saveDraft}
              </button>
              {!idea.slug.startsWith("draft-") ? (
                <Link
                  href={`/ideas/${idea.slug}`}
                  className="neon-btn-ghost rounded-lg px-4 py-2 text-sm"
                >
                  {ws.catalogCard}
                </Link>
              ) : null}
              <Link
                href="/brainstorm#free-form"
                className="neon-btn-ghost rounded-lg px-4 py-2 text-sm"
              >
                {ws.newProject} →
              </Link>
              <Link
                href="/brainstorm"
                className="neon-btn-ghost rounded-lg px-4 py-2 text-sm"
              >
                {ws.backThemes}
              </Link>
              <button
                type="button"
                onClick={() => setActiveTab("publish")}
                className="neon-btn rounded-lg px-4 py-2 text-sm font-medium"
              >
                {ws.preparePublish} →
              </button>
            </div>
          </section>
        </>
      ) : (
        <BrainstormPublishSection idea={idea} draft={draft} />
      )}
    </div>
  );
}
