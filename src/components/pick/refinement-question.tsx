// src/components/pick/refinement-question.tsx
import type { PickQuestion } from "@/lib/ideas/pick-refinement";

interface RefinementQuestionProps {
  question: PickQuestion;
  onChoose: (choiceId: string) => void;
  disabled?: boolean;
}

export function RefinementQuestion({
  question,
  onChoose,
  disabled,
}: RefinementQuestionProps) {
  return (
    <section className="rounded-xl border border-[var(--accent)]/40 bg-[var(--card)] p-5">
      <p className="text-xs uppercase tracking-wide text-[var(--accent)]">
        Question {question.id.replace(/_/g, " ")}
      </p>
      <h2 className="mt-2 text-lg font-semibold leading-snug">{question.text}</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {question.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            disabled={disabled}
            onClick={() => onChoose(choice.id)}
            className="rounded-lg border border-[var(--border)] p-3 text-left transition hover:border-[var(--accent)] disabled:opacity-50"
          >
            <span className="font-medium">{choice.label}</span>
            {choice.hint ? (
              <span className="mt-1 block text-xs text-[var(--muted)]">
                {choice.hint}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
