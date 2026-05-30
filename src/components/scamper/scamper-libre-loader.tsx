// src/components/scamper/scamper-libre-loader.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScamperWorkspace } from "./scamper-workspace";
import { freeIdeaToCatalogShape, loadFreeIdea } from "@/lib/ideas/free-idea";
import type { ScamperWorkItem } from "@/lib/ideas/scamper";

interface ScamperLibreLoaderProps {
  id: string;
}

export function ScamperLibreLoader({ id }: ScamperLibreLoaderProps) {
  const [workItem, setWorkItem] = useState<ScamperWorkItem | null | undefined>(
    undefined,
  );

  useEffect(() => {
    const free = loadFreeIdea(id);
    if (!free) {
      setWorkItem(null);
      return;
    }
    const shaped = freeIdeaToCatalogShape(free);
    setWorkItem({
      slug: shaped.slug,
      title: shaped.title,
      tagline: shaped.tagline,
      description: shaped.description,
      mode: "free",
    });
  }, [id]);

  if (workItem === undefined) {
    return <p className="text-[var(--muted)]">Chargement…</p>;
  }

  if (workItem === null) {
    return (
      <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="text-[var(--muted)]">Idée libre introuvable dans ce navigateur.</p>
        <Link
          href="/scamper/libre"
          className="inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black"
        >
          Créer une idée libre
        </Link>
      </div>
    );
  }

  return <ScamperWorkspace workItem={workItem} />;
}
