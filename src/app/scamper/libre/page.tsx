// src/app/scamper/libre/page.tsx
import { Suspense } from "react";
import { ScamperFreeHub } from "@/components/scamper/scamper-free-hub";

export default function ScamperLibrePage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[var(--muted)]">Chargement…</p>
      }
    >
      <ScamperFreeHub />
    </Suspense>
  );
}
