"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { Idea } from "@/lib/ideas/schema";
import type { IdeaFullState } from "@/lib/ideas/idea-state";
import {
  buildPublishPlan,
  type BrainstormDraft,
  type PublishPlan,
} from "@/lib/ideas/publish-plan";
import { GithubAuthPanel } from "@/components/github/github-auth-panel";
import { AtomNameVerificationPanel } from "@/components/brainstorm/atom-name-verification-panel";
import { WalletPanelSlot } from "@/components/wallet/wallet-panel-slot";
import { PublishTabNav } from "@/components/brainstorm/publish-tab-nav";
import type { OnchainPublishPreview } from "@/lib/intuition/publish-preview";
import type { AtomNameVerification } from "@/lib/ideas/verify-atom-by-name";
import { publishStrings as s } from "@/lib/strings/publish";
import { getNetworkConfig } from "@/lib/intuition/config";

interface DetailResponse {
  state: IdeaFullState;
}

type PublishStatus =
  | { state: "idle" }
  | { state: "loading"; label: string }
  | { state: "ok"; label: string; detail?: string; prUrl?: string; explorerUrl?: string }
  | { state: "warning"; label: string; detail?: string; githubNewFileUrl?: string }
  | { state: "error"; label: string; detail?: string };

type PublishTab = "overview" | "github" | "onchain" | "preview";

const PUBLISH_TABS: ReadonlyArray<{ id: PublishTab; label: string }> = [
  { id: "overview", label: s.tabs.overview },
  { id: "github", label: s.tabs.github },
  { id: "onchain", label: s.tabs.onchain },
  { id: "preview", label: s.tabs.preview },
];

function StatusMessage({ status }: { status: PublishStatus }) {
  if (status.state === "idle") return null;
  const tone =
    status.state === "error"
      ? "border-red-900/50 bg-red-950/30 text-red-200"
      : status.state === "warning"
        ? "border-amber-900/50 bg-amber-950/30 text-amber-100"
        : status.state === "ok"
          ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-200"
          : "border-sky-900/50 bg-sky-950/30 text-sky-200";
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tone}`}>
      <p className="font-medium">{status.label}</p>
      {"detail" in status && status.detail ? (
        <p className="mt-1 break-all text-xs">{status.detail}</p>
      ) : null}
      {status.state === "ok" && status.explorerUrl ? (
        <a
          href={status.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-[var(--accent)] hover:underline"
        >
          {s.viewAtomExplorer}
        </a>
      ) : null}
      {status.state === "ok" && status.prUrl ? (
        <a
          href={status.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-[var(--accent)] hover:underline"
        >
          {s.openPrGithub}
        </a>
      ) : null}
      {status.state === "warning" && status.githubNewFileUrl ? (
        <a
          href={status.githubNewFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-[var(--accent)] hover:underline"
        >
          {s.createFileGithub}
        </a>
      ) : null}
    </div>
  );
}

function StatusGrid({
  loading,
  state,
}: {
  loading: boolean;
  state: IdeaFullState | null;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h3 className="font-semibold">{s.statusTitle}</h3>
      {loading ? (
        <p className="mt-2 text-sm text-[var(--muted)]">{s.checking}</p>
      ) : state ? (
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-[var(--background)] p-3">
            <p className="text-xs text-[var(--muted)]">{s.scoped}</p>
            <p className="font-medium">{state.db.scoped ? s.yes : s.no}</p>
          </div>
          <div className="rounded-lg bg-[var(--background)] p-3">
            <p className="text-xs text-[var(--muted)]">{s.githubPr}</p>
            <p className="font-medium">{state.db.hasGithubPr ? s.yes : s.no}</p>
          </div>
          <div className="rounded-lg bg-[var(--background)] p-3">
            <p className="text-xs text-[var(--muted)]">{s.atomIndexed}</p>
            <p className="break-all font-mono text-xs">
              {state.onchain?.atomInIndexer ? state.onchain.atomId : s.no}
            </p>
          </div>
          <div className="rounded-lg bg-[var(--background)] p-3">
            <p className="text-xs text-[var(--muted)]">{s.coreTriple}</p>
            <p className="font-medium">
              {state.onchain?.coreTriplePresent ? s.yes : s.no}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-[var(--muted)]">{s.loadFailed}</p>
      )}
    </section>
  );
}

interface BrainstormPublishSectionProps {
  idea: Idea;
  draft: BrainstormDraft;
}

export function BrainstormPublishSection({
  idea,
  draft,
}: BrainstormPublishSectionProps) {
  const pathname = usePathname();
  const isDraft = idea.slug.startsWith("draft-");
  const [activeTab, setActiveTab] = useState<PublishTab>("overview");
  const [state, setState] = useState<IdeaFullState | null>(null);
  const [loading, setLoading] = useState(!isDraft);
  const [status, setStatus] = useState<PublishStatus>({ state: "idle" });
  const [onchainStatus, setOnchainStatus] = useState<PublishStatus>({ state: "idle" });
  const [githubConnected, setGithubConnected] = useState(false);
  const [nameVerification, setNameVerification] = useState<AtomNameVerification | null>(null);
  const [onchainPreview, setOnchainPreview] = useState<OnchainPublishPreview | null>(null);
  const [onchainPreviewLoading, setOnchainPreviewLoading] = useState(true);

  const returnTo = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.pathname}${window.location.hash || "#publication"}`;
    }
    return `${pathname}#publication`;
  }, [pathname]);

  useEffect(() => {
    if (isDraft) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/idea-state/${encodeURIComponent(idea.slug)}?verifyOnchain=true`,
        );
        if (res.ok) {
          const data = (await res.json()) as DetailResponse;
          setState(data.state);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [idea.slug, isDraft]);

  useEffect(() => {
    void (async () => {
      setOnchainPreviewLoading(true);
      try {
        const res = await fetch("/api/publish/onchain/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: idea.slug, idea, draft }),
        });
        if (res.ok) {
          const data = (await res.json()) as { preview: OnchainPublishPreview };
          setOnchainPreview(data.preview);
        } else {
          setOnchainPreview(null);
        }
      } finally {
        setOnchainPreviewLoading(false);
      }
    })();
  }, [idea, draft]);

  const plan: PublishPlan = useMemo(
    () => buildPublishPlan(idea, draft),
    [idea, draft],
  );

  function publishBody() {
    const currentReturnTo =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.hash || "#publication"}`
        : `${pathname}#publication`;
    return JSON.stringify({
      slug: idea.slug,
      draft,
      idea,
      prompt: idea.tagline || idea.description,
      category: idea.category,
      returnTo: currentReturnTo,
    });
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(plan.markdown);
    setStatus({ state: "ok", label: s.markdownCopied });
  }

  async function createGithubPr() {
    setStatus({ state: "loading", label: s.openingPr });

    let res: Response;
    try {
      res = await fetch("/api/publish/github-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: publishBody(),
      });
    } catch (err) {
      setStatus({
        state: "error",
        label: s.apiUnreachable,
        detail: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    let data: {
      mode?: string;
      prUrl?: string;
      reason?: string;
      error?: string;
      githubNewFileUrl?: string;
      loginUrl?: string;
    };
    try {
      data = (await res.json()) as typeof data;
    } catch {
      setStatus({ state: "error", label: s.invalidResponse });
      return;
    }

    if (data.mode === "auth_required" || (res.status === 401 && data.loginUrl)) {
      setStatus({
        state: "warning",
        label: s.githubLoginRequired,
        detail: data.reason,
      });
      if (data.loginUrl) window.location.href = data.loginUrl;
      return;
    }

    if (data.mode === "created" && data.prUrl) {
      try {
        await navigator.clipboard.writeText(plan.markdown);
      } catch {
        /* ignore */
      }
      window.open(data.prUrl, "_blank", "noopener,noreferrer");
      setStatus({
        state: "ok",
        label: s.prCreated,
        detail: data.prUrl,
        prUrl: data.prUrl,
      });
      return;
    }

    if (data.mode === "manual") {
      try {
        await navigator.clipboard.writeText(plan.markdown);
      } catch {
        /* ignore */
      }
      setStatus({
        state: "warning",
        label: s.manualPr,
        detail: data.reason,
        githubNewFileUrl: data.githubNewFileUrl,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(plan.markdown);
    } catch {
      /* ignore */
    }

    if (data.githubNewFileUrl) {
      setStatus({
        state: "warning",
        label: s.prFailedCopied,
        detail: data.error,
        githubNewFileUrl: data.githubNewFileUrl,
      });
      return;
    }

    setStatus({
      state: "error",
      label: res.status === 404 ? s.ideaNotFound : s.githubApiFailed,
      detail: [data.error, data.reason].filter(Boolean).join(" "),
    });
  }

  async function publishOnchain() {
    if (nameVerification && !nameVerification.canPublishNewAtom) {
      setOnchainStatus({
        state: "warning",
        label: s.publishBlocked,
        detail: nameVerification.message,
      });
      return;
    }

    setOnchainStatus({ state: "loading", label: s.publishing });

    try {
      const res = await fetch("/api/publish/onchain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: idea.slug, idea, draft }),
      });
      const data = (await res.json()) as {
        mode?: string;
        result?: {
          explorerUrls?: { ideaAtom?: string };
          ideaAtomId?: string;
        };
        error?: string;
        hint?: string;
      };

      if (!res.ok) {
        setOnchainStatus({
          state: "error",
          label: s.publishFailed,
          detail: [data.error, data.hint].filter(Boolean).join(" "),
        });
        return;
      }

      const explorerUrl =
        data.result?.explorerUrls?.ideaAtom ??
        (data.result?.ideaAtomId
          ? `${onchainPreview?.explorerBase ?? getNetworkConfig().explorer}/atom/${data.result.ideaAtomId}`
          : undefined);

      setOnchainStatus({
        state: "ok",
        label:
          data.mode === "already_complete" ? s.alreadyComplete : s.publishSuccess,
        detail: data.result?.ideaAtomId,
        explorerUrl,
      });

      if (!isDraft) {
        const stateRes = await fetch(
          `/api/idea-state/${encodeURIComponent(idea.slug)}?verifyOnchain=true`,
        );
        if (stateRes.ok) {
          const stateData = (await stateRes.json()) as DetailResponse;
          setState(stateData.state);
        }
      }
    } catch (err) {
      setOnchainStatus({
        state: "error",
        label: s.onchainApiUnreachable,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const canPublishOnchain =
    Boolean(onchainPreview?.canPublish || onchainPreview?.alreadyComplete) &&
    (nameVerification?.canPublishNewAtom ?? true);

  return (
    <section
      id="publication"
      className="scroll-mt-8 space-y-6 border-t border-[var(--border)] pt-8"
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--accent)]">{s.kicker}</p>
        <h2 className="mt-1 text-xl font-bold">{s.title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Open a PR on{" "}
          <a
            href="https://github.com/intuition-box/ideas"
            className="text-[var(--accent)] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            intuition-box/ideas
          </a>
          , then on-chain attestation (atom + core triple) if the name is not taken yet.
        </p>
      </div>

      <PublishTabNav tabs={PUBLISH_TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <div className="space-y-5">
          <AtomNameVerificationPanel
            projectName={idea.title}
            onVerificationChange={setNameVerification}
          />
          {isDraft ? (
            <p className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
              {s.draftNotice}
            </p>
          ) : (
            <StatusGrid loading={loading} state={state} />
          )}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="font-semibold">{s.semanticPlan}</h3>
            <p className="mt-3 rounded-lg bg-[var(--background)] p-3 font-mono text-xs">
              {plan.coreTriple.join(" - ")}
            </p>
            {!plan.readiness.onchainReady && plan.readiness.warnings.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs text-amber-200">
                {plan.readiness.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      ) : null}

      {activeTab === "github" ? (
        <div className="space-y-5">
          <GithubAuthPanel returnTo={returnTo} onConnectedChange={setGithubConnected} />
          <StatusMessage status={status} />
          <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="font-semibold">{s.actions}</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void createGithubPr()}
                disabled={!githubConnected}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {s.openGithubPr}
              </button>
              <button
                type="button"
                onClick={() => void copyMarkdown()}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
              >
                {s.copyMarkdown}
              </button>
            </div>
            {!githubConnected ? (
              <p className="mt-3 text-xs text-[var(--muted)]">{s.connectGithubHint}</p>
            ) : null}
          </section>
        </div>
      ) : null}

      {activeTab === "onchain" ? (
        <div className="space-y-5">
          <WalletPanelSlot />
          <StatusMessage status={onchainStatus} />
          <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <div>
              <h3 className="font-semibold">{s.onchainTitle}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {s.onchainLead
                  .replace("{title}", idea.title)
                  .replace("{network}", onchainPreview?.network ?? "testnet")}
              </p>
            </div>

            {onchainPreviewLoading ? (
              <p className="text-sm text-[var(--muted)]">{s.estimatingCost}</p>
            ) : onchainPreview ? (
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-[var(--background)] p-3">
                  <p className="text-xs text-[var(--muted)]">{s.estimatedCost}</p>
                  <p className="font-medium">
                    {onchainPreview.totalEstimatedCostFormatted}{" "}
                    {onchainPreview.nativeSymbol}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--background)] p-3">
                  <p className="text-xs text-[var(--muted)]">{s.serverWallet}</p>
                  <p className="font-medium">
                    {onchainPreview.walletConfigured ? s.configured : s.missing}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--background)] p-3">
                  <p className="text-xs text-[var(--muted)]">{s.existingAtom}</p>
                  <p className="font-medium">
                    {onchainPreview.steps.find((step) => step.id === "ideaAtom")?.exists
                      ? s.yes
                      : s.no}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--background)] p-3">
                  <p className="text-xs text-[var(--muted)]">{s.coreTriple}</p>
                  <p className="font-medium">
                    {onchainPreview.alreadyComplete ? s.complete : s.toCreate}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">{s.previewUnavailable}</p>
            )}

            {onchainPreview?.blockers.length ? (
              <ul className="space-y-1 text-xs text-amber-200">
                {onchainPreview.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void publishOnchain()}
                disabled={!canPublishOnchain || onchainPreviewLoading}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {onchainPreview?.alreadyComplete ? s.verifyOnchain : s.publishOnchain}
              </button>
              {nameVerification && !nameVerification.canPublishNewAtom ? (
                <p className="text-xs text-amber-200">
                  {s.blockedExistingName.replace("{title}", idea.title)}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "preview" ? (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-semibold">{s.readmePreview}</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">{plan.githubPath}</p>
          <pre className="mt-4 max-h-[32rem] overflow-auto rounded-lg bg-[var(--background)] p-4 text-xs leading-relaxed text-[var(--muted)]">
            {plan.markdown}
          </pre>
        </section>
      ) : null}

      <section className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-semibold">{s.startAnotherIdea}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Done with this idea? Start a fresh brainstorm without picking a catalog card.
        </p>
        <Link
          href="/brainstorm#free-form"
          className="mt-4 inline-block rounded-lg border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10"
        >
          {s.startAnotherIdea} →
        </Link>
      </section>
    </section>
  );
}
