// src/components/brainstorm/idea-card.tsx
import type { IdeaFullState } from "@/lib/ideas/idea-state";

const BADGE_LABELS: Record<string, string> = {
  catalog: "Catalog",
  scoped: "Scoped",
  pr: "GitHub PR",
  onchain: "Onchain",
  triple: "Core triple",
  needs_work: "Needs work",
};

interface IdeaCardProps {
  state: IdeaFullState;
  selected: boolean;
  onSelect: () => void;
}

export function IdeaCard({ state, selected, onSelect }: IdeaCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-full min-h-[220px] w-full flex-col rounded-xl border p-4 text-left transition ${
        selected
          ? "border-[var(--accent)] bg-[var(--card)] ring-2 ring-[var(--accent)]"
          : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-[var(--accent)]">
        {state.category}
      </p>
      <h3 className="mt-2 line-clamp-2 text-lg font-semibold">{state.title}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-[var(--muted)]">
        {state.tagline || state.title}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {state.badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted)]"
          >
            {BADGE_LABELS[badge] ?? badge}
          </span>
        ))}
      </div>
    </button>
  );
}
