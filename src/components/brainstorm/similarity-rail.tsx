// src/components/brainstorm/similarity-rail.tsx
"use client";

import Link from "next/link";
import type {
  SimilarityItem,
  SimilarityResult,
} from "@/lib/ideas/brainstorm-similarity";

const BADGE_LABELS: Record<string, string> = {
  atom_exists: "Atom exists",
  triple_exists: "Triple exists",
  strong_signal: "Strong signal",
  contested: "Contested",
};

const BADGE_STYLES: Record<string, string> = {
  atom_exists: "border-blue-800/60 text-blue-300",
  triple_exists: "border-orange-800/60 text-orange-300",
  strong_signal: "border-emerald-800/60 text-emerald-300",
  contested: "border-red-800/60 text-red-300",
};

interface SimilarityRailProps {
  data: SimilarityResult | null;
  loading: boolean;
  onRefresh: () => void;
}

function SimilarityCard({ item }: { item: SimilarityItem }) {
  const href =
    item.source === "catalog" && item.slug
      ? `/ideas/${item.slug}`
      : item.termId
        ? `https://testnet.portal.intuition.systems/explore/home`
        : undefined;

  const inner = (
    <>
      <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
      {item.subtitle ? (
        <p className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">
          {item.subtitle}
        </p>
      ) : null}
      {item.badges.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.badges.slice(0, 4).map((badge) => (
            <span
              key={badge}
              className={`rounded border px-1.5 py-0.5 text-[10px] ${BADGE_STYLES[badge] ?? "border-[var(--border)] text-[var(--muted)]"}`}
            >
              {BADGE_LABELS[badge] ?? badge}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );

  if (href && item.source === "catalog") {
    return (
      <Link
        href={href}
        className="block rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 transition hover:border-[var(--accent)]"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
      {inner}
      {item.source === "graph" ? (
        <p className="mt-1 text-[10px] uppercase text-[var(--muted)]">Graphe</p>
      ) : null}
    </div>
  );
}

function SimilarityGroup({
  title,
  items,
}: {
  title: string;
  items: SimilarityItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {title}
      </h3>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <SimilarityCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export function SimilarityRail({ data, loading, onRefresh }: SimilarityRailProps) {
  return (
    <aside className="flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Recherche d&apos;existant</h2>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="text-xs text-[var(--accent)] hover:underline disabled:opacity-50"
          >
            {loading ? "…" : "Actualiser"}
          </button>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Texte · graphe · signal
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {loading && !data ? (
          <p className="text-sm text-[var(--muted)]">Recherche…</p>
        ) : null}

        {data ? (
          <>
            <SimilarityGroup title="Correspondances exactes" items={data.exact} />
            <SimilarityGroup title="Idées proches" items={data.close} />
            <SimilarityGroup title="Adjacences utiles" items={data.adjacent} />

            {data.exact.length === 0 &&
            data.close.length === 0 &&
            data.adjacent.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Aucun voisin détecté — territoire relativement libre.
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      {data?.challengeNotes.length ? (
        <div className="border-t border-[var(--border)] p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-400">
            Challenge / contre-lecture
          </h3>
          <ul className="mt-2 space-y-2">
            {data.challengeNotes.map((note) => (
              <li key={note} className="text-xs text-[var(--muted)]">
                {note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
