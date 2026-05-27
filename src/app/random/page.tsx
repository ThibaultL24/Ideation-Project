// src/app/random/page.tsx
import Link from "next/link";
import { loadNormalizedIdeas } from "@/lib/ideas/load";

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export default function RandomPage() {
  const idea = pickRandom(loadNormalizedIdeas());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Découvrir</h1>
      {!idea ? (
        <p className="text-[var(--muted)]">Catalogue vide.</p>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <p className="text-xs text-[var(--accent)]">{idea.category}</p>
          <h2 className="mt-2 text-2xl font-bold">{idea.title}</h2>
          <p className="mt-3 text-[var(--muted)]">{idea.description}</p>
          <Link
            href={`/ideas/${idea.slug}`}
            className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
          >
            Voir la fiche
          </Link>
        </div>
      )}
    </div>
  );
}
