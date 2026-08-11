// src/components/ideas/idea-detail-view.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IdeaDetailAttachments } from "@/components/ideas/idea-detail-attachments";
import { loadLocalCommunityIdeas } from "@/lib/ideas/community-catalog-shared";
import type { Idea } from "@/lib/ideas/schema";
import { networkExplorerAtomUrl } from "@/lib/intuition/config";

interface IdeaDetailViewProps {
  slug: string;
  idea: Idea | null;
  onchainAtomId?: string | null;
  atomInIndexer?: boolean;
  coreTriplePresent?: boolean;
}

export function IdeaDetailView({
  slug,
  idea: serverIdea,
  onchainAtomId,
  atomInIndexer,
  coreTriplePresent,
}: IdeaDetailViewProps) {
  const [idea, setIdea] = useState<Idea | null>(serverIdea);

  useEffect(() => {
    if (serverIdea) {
      setIdea(serverIdea);
      return;
    }
    const local = loadLocalCommunityIdeas().find((row) => row.slug === slug) ?? null;
    setIdea(local);
  }, [slug, serverIdea]);

  if (!idea) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Idea not found</h1>
        <p className="text-sm text-[var(--muted)]">
          This idea is not in the catalog yet. Publish a GitHub PR from brainstorm
          to add it.
        </p>
        <Link href="/ideas" className="text-[var(--accent)] hover:underline">
          ← Catalog
        </Link>
      </div>
    );
  }

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

      {onchainAtomId ? (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm">
          <h2 className="font-semibold">Onchain</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Atom indexed: {atomInIndexer ? "yes" : "no"} · Core triple:{" "}
            {coreTriplePresent ? "yes" : "no"}
          </p>
          <p className="mt-2 break-all font-mono text-xs text-[var(--muted)]">
            {onchainAtomId}
          </p>
          <a
            href={networkExplorerAtomUrl(onchainAtomId)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-[var(--accent)] hover:underline"
          >
            View on explorer →
          </a>
        </section>
      ) : null}

      <IdeaDetailAttachments
        prUrl={idea.github?.prUrl}
        blobUrl={idea.github?.blobUrl}
      />

      <div className="flex flex-wrap gap-4">
        <Link
          href={`/brainstorm/idea/${idea.slug}`}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
        >
          Brainstorm
        </Link>
        <Link
          href={`/brainstorm/idea/${idea.slug}#publication`}
          className="rounded-lg border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)]"
        >
          Publish
        </Link>
        <Link href="/ideas" className="text-sm text-[var(--accent)] hover:underline">
          ← Catalog
        </Link>
      </div>
    </article>
  );
}
