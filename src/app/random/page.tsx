import Link from "next/link";
import { loadNormalizedIdeas } from "@/lib/ideas/load";
import { buildIdeaFullState } from "@/lib/ideas/idea-state";

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export default async function RandomPage() {
  const idea = pickRandom(loadNormalizedIdeas());
  const state = idea
    ? await buildIdeaFullState(idea, { verifyOnchain: true })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--accent)]">
          Random on-chain idea
        </p>
        <h1 className="mt-1 text-2xl font-bold">Discover a lead</h1>
      </div>
      {!idea || !state ? (
        <p className="text-[var(--muted)]">Empty catalog.</p>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex flex-wrap items-center gap-2">
            {state.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)]"
              >
                {badge}
              </span>
            ))}
          </div>
          <p className="mt-5 text-xs text-[var(--accent)]">{idea.category}</p>
          <h2 className="mt-2 text-2xl font-bold">{idea.title}</h2>
          <p className="mt-3 text-[var(--muted)]">{idea.description}</p>
          <div className="mt-5 grid gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-lg bg-[var(--background)] p-3">
              <p className="text-[var(--muted)]">Atom</p>
              <p className="mt-1 break-all font-mono">
                {state.onchain?.atomInIndexer ? state.onchain.atomId : "not indexed"}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--background)] p-3">
              <p className="text-[var(--muted)]">Core triple</p>
              <p className="mt-1">
                {state.onchain?.coreTriplePresent ? "queryable" : "missing"}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--background)] p-3">
              <p className="text-[var(--muted)]">Next action</p>
              <p className="mt-1">{state.nextAction}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/brainstorm/${idea.slug}`}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
            >
              Brainstorm (AI)
            </Link>
            <Link
              href={`/prepare/${idea.slug}`}
              className="rounded-lg border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)]"
            >
              Prepare
            </Link>
            <Link
              href={`/ideas/${idea.slug}`}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
            >
              Catalog entry
            </Link>
            <Link
              href="/random"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
            >
              Another random
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
