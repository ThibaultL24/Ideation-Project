// src/app/workshop/refine/page.tsx
import { RefineFlow } from "@/components/workshop/refine-flow";

export default function WorkshopRefinePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cartes d&apos;affinage</h1>
      <p className="text-sm text-[var(--muted)]">
        Choisis une carte — quatre nouvelles propositions plus précises apparaîtront.
      </p>
      <RefineFlow />
    </div>
  );
}
