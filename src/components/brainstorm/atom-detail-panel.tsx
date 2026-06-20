// src/components/brainstorm/atom-detail-panel.tsx
import Link from "next/link";
import type { Idea } from "@/lib/ideas/schema";
import type { IdeaOnchainState } from "@/lib/ideas/idea-state";
import { categoryToSlug } from "@/lib/ideas/category";
import { getNetworkConfig, getPortalExplorerUrl } from "@/lib/intuition/config";

interface AtomDetailPanelProps {
  idea: Idea;
  onchain: IdeaOnchainState;
  categorySlug: string;
}

export function AtomDetailPanel({
  idea,
  onchain,
  categorySlug,
}: AtomDetailPanelProps) {
  const config = getNetworkConfig();
  const portalHome = getPortalExplorerUrl(config.network);
  const explorerAtomUrl = onchain.atomId
    ? `${config.explorer}/atom/${onchain.atomId}`
    : portalHome;

  return (
    <article className="space-y-6">
      <div>
        <Link
          href={`/brainstorm/category/${categorySlug}`}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← Back to category
        </Link>
        <p className="mt-4 text-xs uppercase tracking-wide text-[var(--accent)]">
          {idea.category}
        </p>
        <h1 className="mt-2 text-3xl font-bold">{idea.title}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{idea.tagline}</p>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">Description</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">
          {idea.description}
        </p>
        {idea.comparable ? (
          <p className="mt-4 text-xs text-[var(--muted)]">
            Comparable · {idea.comparable}
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm">
        <h2 className="font-semibold">Onchain status</h2>
        <ul className="mt-3 space-y-2 text-[var(--muted)]">
          <li>
            <span className="text-[var(--foreground)]">Atom indexed · </span>
            {onchain.atomInIndexer ? "yes" : "no"}
          </li>
          <li>
            <span className="text-[var(--foreground)]">Core triple · </span>
            {onchain.coreTriplePresent
              ? "yes (linked to Intuition Protocol)"
              : "no"}
          </li>
          <li>
            <span className="text-[var(--foreground)]">Network · </span>
            {onchain.network}
          </li>
        </ul>
        {onchain.atomId ? (
          <p className="mt-3 break-all font-mono text-xs">{onchain.atomId}</p>
        ) : null}
        <a
          href={explorerAtomUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-[var(--accent)] hover:underline"
        >
          View on explorer →
        </a>
      </section>

      <p className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100/90">
        This idea already exists on the graph. You cannot duplicate it — refine it
        or contribute via the workspace.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/brainstorm/idea/${idea.slug}`}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
        >
          Refine this idea
        </Link>
        <Link
          href="/brainstorm#free-form"
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-black"
        >
          Create my own idea instead
        </Link>
        <Link
          href={`/brainstorm/category/${categorySlug}`}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          Other ideas in this category
        </Link>
      </div>
    </article>
  );
}
