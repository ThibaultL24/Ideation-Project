// src/app/pick/page.tsx
import Link from "next/link";
import { PickFlow } from "@/components/pick/pick-flow";

export default function PickPage() {
  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-[var(--accent)]/30 bg-[var(--card)] px-4 py-3 text-sm text-[var(--muted)]">
        Parcours recommandé :{" "}
        <Link href="/brainstorm" className="font-medium text-[var(--accent)] hover:underline">
          Brainstorm guidé
        </Link>{" "}
        (décrire → idées proches → questions d&apos;idéation → Prepare). Cette page
        conserve l&apos;ancien filtre par cartes.
      </p>
      <PickFlow />
    </div>
  );
}
