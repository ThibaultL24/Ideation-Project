// src/app/ideas/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadNormalizedIdeas } from "@/lib/ideas/load";
import { portalExplorerUrl } from "@/lib/intuition/claims-graph";

interface IdeaDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function IdeaDetailPage({ params }: IdeaDetailPageProps) {
  const { slug } = await params;
  const idea = loadNormalizedIdeas().find((item) => item.slug === slug);
  if (!idea) notFound();

  const hasAtom = Boolean(idea.intuition?.atomId);
  const hasClaim = Boolean(idea.intuition?.triples?.length);
  const hasMetadata = Boolean(idea.ipfs?.uri);

  return (
    <article className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
          {idea.category}
        </p>
        <h1 className="mt-2 text-3xl font-bold">{idea.title}</h1>
        <p className="mt-2 text-[var(--muted)]">{idea.tagline}</p>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">À propos</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          {idea.description}
        </p>
        {idea.comparable ? (
          <p className="mt-4 text-sm">
            <span className="text-[var(--accent)]">Comparable</span> ·{" "}
            {idea.comparable}
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">Statut onchain</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className={hasMetadata ? "text-[var(--accent)]" : "text-[var(--muted)]"}>
              {hasMetadata ? "✓" : "○"}
            </span>
            Métadonnées IPFS
          </li>
          <li className="flex items-center gap-2">
            <span className={hasAtom ? "text-[var(--accent)]" : "text-[var(--muted)]"}>
              {hasAtom ? "✓" : "○"}
            </span>
            Atom Intuition
          </li>
          <li className="flex items-center gap-2">
            <span className={hasClaim ? "text-[var(--accent)]" : "text-[var(--muted)]"}>
              {hasClaim ? "✓" : "○"}
            </span>
            Attestation (claim)
          </li>
        </ul>
        {hasAtom ? (
          <a
            href={portalExplorerUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
          >
            Voir sur le Portal →
          </a>
        ) : null}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm">
        <h2 className="font-semibold">Références</h2>
        <dl className="mt-3 space-y-2 text-[var(--muted)]">
          <div>
            <dt className="text-xs uppercase">ID</dt>
            <dd className="font-mono text-white">{idea.canonicalId}</dd>
          </div>
          {idea.ipfs?.uri ? (
            <div>
              <dt className="text-xs uppercase">IPFS</dt>
              <dd className="break-all font-mono text-white">{idea.ipfs.uri}</dd>
            </div>
          ) : null}
          {idea.intuition?.atomId ? (
            <div>
              <dt className="text-xs uppercase">Atom</dt>
              <dd className="break-all font-mono text-white">
                {idea.intuition.atomId}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <Link
        href="/ideas"
        className="text-sm text-[var(--accent)] hover:underline"
      >
        ← Retour au catalogue
      </Link>
    </article>
  );
}
