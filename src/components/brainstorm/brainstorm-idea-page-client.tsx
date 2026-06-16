// src/components/brainstorm/brainstorm-idea-page-client.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrainstormWorkspace } from "@/components/brainstorm/brainstorm-workspace";
import { loadFreeIdea } from "@/lib/ideas/ideation-session";
import type { Idea } from "@/lib/ideas/schema";

interface BrainstormIdeaPageClientProps {
  slug: string;
  catalogIdea: Idea | null;
}

export function BrainstormIdeaPageClient({
  slug,
  catalogIdea,
}: BrainstormIdeaPageClientProps) {
  const [idea, setIdea] = useState<Idea | null>(catalogIdea);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (catalogIdea) {
      setIdea(catalogIdea);
      setMissing(false);
      return;
    }

    const free = loadFreeIdea(slug);
    if (free) {
      setIdea(free);
      setMissing(false);
      return;
    }

    setMissing(true);
  }, [slug, catalogIdea]);

  if (missing) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Idée introuvable</h1>
        <p className="text-sm text-[var(--muted)]">
          Cette idée libre n&apos;est pas enregistrée sur cet appareil. Relancez le
          parcours Brainstorm.
        </p>
        <Link href="/brainstorm" className="text-[var(--accent)] hover:underline">
          Retour Brainstorm
        </Link>
      </div>
    );
  }

  if (!idea) {
    return <p className="text-[var(--muted)]">Chargement…</p>;
  }

  return <BrainstormWorkspace idea={idea} />;
}
