// src/components/workshop/intent-form.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { seedBriefFromPreciseIntent } from "@/lib/workshop/workshop-path";
import { defaultSession, saveSession } from "@/lib/workshop/session";

interface IntentFormProps {
  catalogSlug?: string;
  catalogCanonicalId?: string;
  catalogTitle?: string;
  catalogDescription?: string;
}

type EntryMode = "explore" | "precise";

export function IntentForm({
  catalogSlug,
  catalogCanonicalId,
  catalogTitle,
  catalogDescription,
}: IntentFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<EntryMode>("explore");
  const [intent, setIntent] = useState(catalogDescription?.slice(0, 800) ?? "");

  function startExplore() {
    const raw = intent.trim();
    if (raw.length < 10) return;
    saveSession(
      defaultSession({
        path: "explore",
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

  function startPrecise() {
    const raw = intent.trim();
    if (raw.length < 10) return;
    const base = defaultSession({
      path: "precise",
      rawIntent: raw,
      explorationPrompt: raw,
      catalogSlug,
      catalogCanonicalId,
      catalogTitle,
      catalogDescription,
    });
    const ideaBrief = seedBriefFromPreciseIntent(base);
    saveSession({ ...base, ideaBrief });
    router.push("/workshop/prepare");
  }

  return (
    <div className="space-y-6">
      {catalogTitle && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--accent)]">Catalog idea</p>
          <p className="font-semibold">{catalogTitle}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("explore")}
          className={`rounded-lg px-4 py-2 text-sm ${
            mode === "explore"
              ? "bg-[var(--accent)] text-black font-medium"
              : "border border-[var(--border)] text-[var(--muted)]"
          }`}
        >
          Explore & brainstorm
        </button>
        <button
          type="button"
          onClick={() => setMode("precise")}
          className={`rounded-lg px-4 py-2 text-sm ${
            mode === "precise"
              ? "bg-[var(--accent)] text-black font-medium"
              : "border border-[var(--border)] text-[var(--muted)]"
          }`}
        >
          I have a clear idea
        </button>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">
          {mode === "explore"
            ? "What do you want to explore?"
            : "Describe your product idea"}
        </span>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          rows={6}
          placeholder={
            mode === "explore"
              ? "Domain or curiosity — e.g. cinema & culture, heritage walks, portable trust for creators…"
              : "Your product in a few clear sentences: who it is for, what it does, and how Intuition fits…"
          }
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
        />
      </label>

      {mode === "explore" ? (
        <>
          <button
            type="button"
            onClick={startExplore}
            disabled={intent.trim().length < 10}
            className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-black disabled:opacity-40"
          >
            Start brainstorming →
          </button>
          <p className="text-xs text-[var(--muted)]">
            Brainstorm 5 directions → pick one you like → optional deep research →{" "}
            <strong className="text-white/80">Prepare</strong> to open the GitHub PR.
          </p>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={startPrecise}
            disabled={intent.trim().length < 10}
            className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-black disabled:opacity-40"
          >
            Open Prepare — push PR →
          </button>
          <p className="text-xs text-[var(--muted)]">
            Skip brainstorming. Go straight to triples +{" "}
            <strong className="text-white/80">Create GitHub PR</strong>. You can still visit
            Research later to enrich the README.
          </p>
        </>
      )}

      {catalogSlug && (
        <Link href={`/ideas/${catalogSlug}`} className="text-sm text-[var(--muted)] hover:text-white">
          View catalog entry
        </Link>
      )}
    </div>
  );
}
