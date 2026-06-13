// src/components/prepare/prepare-page-client.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Idea } from "@/lib/ideas/schema";
import { loadFreeIdea } from "@/lib/ideas/ideation-session";
import { PrepareWorkspace } from "./prepare-workspace";

interface PreparePageClientProps {
  slug: string;
}

export function PreparePageClient({ slug }: PreparePageClientProps) {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const free = loadFreeIdea(slug);
    if (free) {
      setIdea(free);
      return;
    }
    setMissing(true);
  }, [slug]);

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

  return <PrepareWorkspace idea={idea} />;
}
