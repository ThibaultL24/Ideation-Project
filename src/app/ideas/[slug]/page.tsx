// src/app/ideas/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadNormalizedIdeas } from "@/lib/ideas/load";
import { buildIdeaFullState } from "@/lib/ideas/idea-state";

const PORTAL_EXPLORER_URL =
  "https://testnet.portal.intuition.systems/explore/home";

interface IdeaDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function IdeaDetailPage({ params }: IdeaDetailPageProps) {
  const { slug } = await params;
  const idea = loadNormalizedIdeas().find((item) => item.slug === slug);
  if (!idea) notFound();
  const state = await buildIdeaFullState(idea, { verifyOnchain: true });

  return (
    <article className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
          {idea.category}
        </p>
        <h1 className="mt-2 text-3xl font-bold">{idea.title}</h1>
        {idea.comparable ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Comparable · {idea.comparable}
          </p>
        ) : null}
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">Description</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] whitespace-pre-wrap">
          {idea.description}
        </p>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href={`/brainstorm/idea/${idea.slug}`}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
        >
          Brainstorm
        </Link>
      </section>

      {state.onchain?.atomId ? (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm">
          <h2 className="font-semibold">Onchain</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Atom indexe: {state.onchain.atomInIndexer ? "oui" : "non"} · Triple
            coeur: {state.onchain.coreTriplePresent ? "oui" : "non"}
          </p>
          <p className="mt-2 break-all font-mono text-xs text-[var(--muted)]">
            {state.onchain.atomId}
          </p>
          <a
            href={PORTAL_EXPLORER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-[var(--accent)] hover:underline"
          >
            Voir sur le Portal →
          </a>
        </section>
      ) : null}

      <Link href="/ideas" className="text-sm text-[var(--accent)] hover:underline">
        ← Retour au catalogue
      </Link>
    </article>
  );
}
