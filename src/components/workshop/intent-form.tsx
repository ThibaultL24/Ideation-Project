// src/components/workshop/intent-form.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { defaultSession, saveSession } from "@/lib/workshop/session";

interface IntentFormProps {
  catalogSlug?: string;
  catalogCanonicalId?: string;
  catalogTitle?: string;
  catalogDescription?: string;
}

export function IntentForm({
  catalogSlug,
  catalogCanonicalId,
  catalogTitle,
  catalogDescription,
}: IntentFormProps) {
  const router = useRouter();
  const [intent, setIntent] = useState(
    catalogDescription?.slice(0, 400) ?? "",
  );

  function startWorkshop() {
    const raw = intent.trim();
    if (raw.length < 10) return;
    const session = defaultSession({
      rawIntent: raw,
      catalogSlug,
      catalogCanonicalId,
      catalogTitle,
      catalogDescription,
      refinementSummary: "",
    });
    saveSession(session);
    router.push("/workshop/discover");
  }

  return (
    <div className="space-y-6">
      {catalogTitle && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--accent)]">Idée du catalogue</p>
          <p className="font-semibold">{catalogTitle}</p>
        </div>
      )}
      <label className="block space-y-2">
        <span className="text-sm font-medium">Décris ton idée en quelques phrases</span>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          rows={5}
          placeholder="Ex. Une app qui note les outils IA avec des avis stakés sur Intuition…"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
        />
      </label>
      <button
        type="button"
        onClick={startWorkshop}
        disabled={intent.trim().length < 10}
        className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-black disabled:opacity-40"
      >
        Affiner avec les cartes →
      </button>
      <p className="text-xs text-[var(--muted)]">
        Ensuite : similarités (catalogue + graphe + GitHub), affinage, débrief, fiche,
        puis PR sur intuition-box/ideas — sans publication on-chain.
      </p>
      {catalogSlug && (
        <Link href={`/ideas/${catalogSlug}`} className="text-sm text-[var(--muted)] hover:text-white">
          Voir la fiche catalogue
        </Link>
      )}
    </div>
  );
}
