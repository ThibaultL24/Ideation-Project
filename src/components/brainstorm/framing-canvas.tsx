// src/components/brainstorm/framing-canvas.tsx
"use client";

import { ARCHETYPE_LIST } from "@/lib/ideas/archetypes";
import type { BrainstormCanvas } from "@/lib/ideas/brainstorm-session";

const CANVAS_FIELDS: Array<{
  id: keyof BrainstormCanvas;
  label: string;
  placeholder: string;
}> = [
  {
    id: "problem",
    label: "Problème",
    placeholder: "Qui souffre de quoi ? Comment s'en sort-on aujourd'hui ?",
  },
  {
    id: "mainActor",
    label: "Acteur principal",
    placeholder: "Utilisateur, curateur, développeur…",
  },
  {
    id: "attestedObject",
    label: "Objet attesté ou curé",
    placeholder: "Ce qui est classé, vérifié ou recommandé",
  },
  {
    id: "proofMechanism",
    label: "Mécanisme de preuve / ranking",
    placeholder: "Comment on décide ce qui monte ou descend",
  },
  {
    id: "signalRole",
    label: "Rôle du signal",
    placeholder: "Staking, conviction, visibilité — pourquoi mettre des tokens ?",
  },
  {
    id: "challengeForm",
    label: "Forme de challenge",
    placeholder: "Contestation, counter-claims, disputes possibles",
  },
];

interface FramingCanvasProps {
  archetype?: string;
  canvas: BrainstormCanvas;
  onArchetypeChange: (id: string | undefined) => void;
  onCanvasChange: (id: keyof BrainstormCanvas, value: string) => void;
}

export function FramingCanvas({
  archetype,
  canvas,
  onArchetypeChange,
  onCanvasChange,
}: FramingCanvasProps) {
  return (
    <section className="flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-sm font-semibold">Canvas de cadrage</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Archétype Intuition puis cartes semi-structurées
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Archétype produit
          </legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ARCHETYPE_LIST.map((arch) => {
              const selected = archetype === arch.id;
              return (
                <button
                  key={arch.id}
                  type="button"
                  onClick={() =>
                    onArchetypeChange(selected ? undefined : arch.id)
                  }
                  className={`rounded-lg border p-3 text-left text-sm transition ${
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]"
                      : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)]"
                  }`}
                >
                  <span className="font-medium">{arch.label}</span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    {arch.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {CANVAS_FIELDS.map((field) => (
            <label key={field.id} className="block">
              <span className="text-xs font-semibold">{field.label}</span>
              <textarea
                className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm focus:border-[var(--accent)] focus:outline-none"
                rows={3}
                placeholder={field.placeholder}
                value={canvas[field.id]}
                onChange={(e) => onCanvasChange(field.id, e.target.value)}
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
