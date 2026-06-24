// src/components/brainstorm/onchain-term-preview.tsx
import type { OnchainPublishPreview } from "@/lib/intuition/publish-preview";
import { formatExplorerAtomUrl } from "@/lib/intuition/publish-preview";
import { publishStrings as s } from "@/lib/strings/publish";

interface OnchainTermPreviewProps {
  preview: OnchainPublishPreview;
  githubUrl?: string;
}

function StepBadge({ exists, willCreate }: { exists: boolean; willCreate: boolean }) {
  if (exists) {
    return (
      <span className="rounded-full border border-emerald-800/50 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-200">
        {s.termAlreadyOnchain}
      </span>
    );
  }
  if (willCreate) {
    return (
      <span className="rounded-full border border-sky-800/50 bg-sky-950/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-200">
        {s.termWillCreate}
      </span>
    );
  }
  return null;
}

function TermRow({
  label,
  termId,
  explorerBase,
  exists,
  willCreate,
}: {
  label: string;
  termId: string | null;
  explorerBase: string;
  exists: boolean;
  willCreate: boolean;
}) {
  async function copyId() {
    if (!termId) return;
    try {
      await navigator.clipboard.writeText(termId);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
        <StepBadge exists={exists} willCreate={willCreate} />
      </div>
      {termId ? (
        <>
          <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-[var(--foreground)]">
            {termId}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              onClick={() => void copyId()}
              className="text-[var(--accent)] hover:underline"
            >
              {s.copyTermId}
            </button>
            {exists ? (
              <a
                href={formatExplorerAtomUrl(explorerBase, termId as `0x${string}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                {s.viewTermExplorer}
              </a>
            ) : null}
          </div>
        </>
      ) : (
        <p className="mt-2 text-xs text-[var(--muted)]">{s.termIdPending}</p>
      )}
    </div>
  );
}

export function OnchainTermPreview({ preview, githubUrl }: OnchainTermPreviewProps) {
  const ideaStep = preview.steps.find((step) => step.id === "ideaAtom");
  const tripleStep = preview.steps.find((step) => step.id === "coreTriple");

  return (
    <section className="space-y-3 rounded-lg border border-dashed border-[var(--accent)]/35 bg-[var(--accent)]/5 p-4">
      <div>
        <h4 className="text-sm font-semibold">{s.predictedTermsTitle}</h4>
        <p className="mt-1 text-xs text-[var(--muted)]">{s.predictedTermsLead}</p>
      </div>

      <TermRow
        label={s.predictedIdeaAtom}
        termId={ideaStep?.termId ?? null}
        explorerBase={preview.explorerBase}
        exists={ideaStep?.exists ?? false}
        willCreate={ideaStep?.willCreate ?? false}
      />

      <TermRow
        label={s.predictedCoreTriple}
        termId={tripleStep?.termId ?? null}
        explorerBase={preview.explorerBase}
        exists={tripleStep?.exists ?? false}
        willCreate={tripleStep?.willCreate ?? false}
      />

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2">
          <p className="text-[var(--muted)]">{s.predictedIpfs}</p>
          <p className="mt-1 break-all font-mono text-[10px] text-[var(--foreground)]">
            {preview.ideaIpfsUri ?? s.ipfsPending}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2">
          <p className="text-[var(--muted)]">{s.predictedPrLink}</p>
          {githubUrl ? (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block break-all text-[var(--accent)] hover:underline"
            >
              {githubUrl}
            </a>
          ) : (
            <p className="mt-1 text-[var(--muted)]">{s.prLinkMissing}</p>
          )}
        </div>
      </div>

      <p className="font-mono text-[11px] text-[var(--muted)]">
        {preview.coreTriple.join(" → ")}
      </p>
    </section>
  );
}
