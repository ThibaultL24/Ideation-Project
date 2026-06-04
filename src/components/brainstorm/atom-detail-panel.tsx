// src/components/brainstorm/atom-detail-panel.tsx
import Link from "next/link";
import type { Idea } from "@/lib/ideas/schema";
import type { IdeaOnchainState } from "@/lib/ideas/idea-state";
import { categoryToSlug } from "@/lib/ideas/category";
import { getNetworkConfig } from "@/lib/intuition/config";

const PORTAL_HOME =
  "https://testnet.portal.intuition.systems/explore/home";

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
  const explorerAtomUrl = onchain.atomId
    ? `${config.explorer}/atom/${onchain.atomId}`
    : PORTAL_HOME;

  return (
    <article className="space-y-6">
      <div>
        <Link
          href={`/brainstorm/category/${categorySlug}`}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← Retour à la catégorie
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
        <h2 className="font-semibold">État onchain</h2>
        <ul className="mt-3 space-y-2 text-[var(--muted)]">
          <li>
            <span className="text-[var(--foreground)]">Atom indexé · </span>
            {onchain.atomInIndexer ? "oui" : "non"}
          </li>
          <li>
            <span className="text-[var(--foreground)]">Triple cœur · </span>
            {onchain.coreTriplePresent
              ? "oui (relié à Intuition Protocol)"
              : "non"}
          </li>
          <li>
            <span className="text-[var(--foreground)]">Réseau · </span>
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
          Voir sur l’explorateur →
        </a>
      </section>

      <p className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100/90">
        Cette idée existe déjà sur le graphe. Vous ne pouvez pas la dupliquer —
        affinez-la ou contribuez via le workspace.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/brainstorm/idea/${idea.slug}`}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
        >
          Affiner cette idée
        </Link>
        <Link
          href={`/brainstorm/category/${categorySlug}`}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
        >
          Autres idées de la catégorie
        </Link>
      </div>
    </article>
  );
}
