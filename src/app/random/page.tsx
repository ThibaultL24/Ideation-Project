// src/app/random/page.tsx
import Link from "next/link";
import { loadNormalizedIdeas } from "@/lib/ideas/load";

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export default function DiscoverPage() {
  const ideas = loadNormalizedIdeas();
  const idea = pickRandom(ideas);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Découvrir</h1>
        <p className="text-sm text-[var(--muted)]">
          Une suggestion aléatoire depuis le catalogue.
        </p>
      </div>
      {!idea ? (
        <p className="text-[var(--muted)]">Aucun projet disponible.</p>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <p className="text-xs text-[var(--accent)]">{idea.category}</p>
          <h2 className="mt-2 text-2xl font-bold">{idea.title}</h2>
          <p className="mt-3 text-[var(--muted)]">{idea.description}</p>
          {idea.comparable ? (
            <p className="mt-4 text-sm">
              <span className="text-[var(--accent)]">Comparable</span> ·{" "}
              {idea.comparable}
            </p>
          ) : null}
          <div className="mt-6 flex gap-3">
            <Link
              href={`/ideas/${idea.slug}`}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
            >
              Voir la fiche
            </Link>
            <Link
              href="/random"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
            >
              Autre projet
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
