// src/components/brainstorm/brainstorm-libre-loader.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrainstormWorkspace } from "./brainstorm-workspace";
import { freeIdeaToCatalogShape, loadFreeIdea } from "@/lib/ideas/free-idea";
import type { Idea } from "@/lib/ideas/schema";

interface BrainstormLibreLoaderProps {
  id: string;
}

export function BrainstormLibreLoader({ id }: BrainstormLibreLoaderProps) {
  const [idea, setIdea] = useState<Idea | null | undefined>(undefined);

  useEffect(() => {
    const free = loadFreeIdea(id);
    setIdea(free ? freeIdeaToCatalogShape(free) : null);
  }, [id]);

  if (idea === undefined) {
    return <p className="text-[var(--muted)]">Chargement…</p>;
  }

  if (idea === null) {
    return (
      <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="text-[var(--muted)]">Idée libre introuvable.</p>
        <Link
          href="/scamper/libre"
          className="inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
        >
          Créer une idée libre
        </Link>
      </div>
    );
  }

  return <BrainstormWorkspace idea={idea} isFreeIdea />;
}
