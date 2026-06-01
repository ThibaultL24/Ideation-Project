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
  const [intent, setIntent] = useState(catalogDescription?.slice(0, 800) ?? "");

  function startWorkshop() {
    const raw = intent.trim();
    if (raw.length < 10) return;
    saveSession(
      defaultSession({
        rawIntent: raw,
        explorationPrompt: raw,
        catalogSlug,
        catalogCanonicalId,
        catalogTitle,
        catalogDescription,
      }),
    );
    router.push("/workshop/research");
  }

  return (
    <div className="space-y-6">
      {catalogTitle && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--accent)]">Catalog idea</p>
          <p className="font-semibold">{catalogTitle}</p>
        </div>
      )}
      <label className="block space-y-2">
        <span className="text-sm font-medium">What do you want to explore?</span>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          rows={6}
          placeholder="You don't need a finished product. Describe a domain, curiosity, or problem space — e.g. cinema & culture, portable trust for creators, heritage walks…"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
        />
      </label>
      <button
        type="button"
        onClick={startWorkshop}
        disabled={intent.trim().length < 10}
        className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-black disabled:opacity-40"
      >
        Start brainstorming →
      </button>
      <p className="text-xs text-[var(--muted)]">
        First: 5 coherent product directions on Intuition. Then: deep research, brief sheet,
        on-chain reputation, optional GitHub PR.
      </p>
      {catalogSlug && (
        <Link href={`/ideas/${catalogSlug}`} className="text-sm text-[var(--muted)] hover:text-white">
          View catalog entry
        </Link>
      )}
    </div>
  );
}
