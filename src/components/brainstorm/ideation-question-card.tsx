// src/components/brainstorm/ideation-question-card.tsx
"use client";

import type { IdeationQuestion } from "@/lib/ideas/ideation-questions";

interface IdeationQuestionCardProps {
  question: IdeationQuestion;
  step: number;
  total: number;
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onSkip?: () => void;
  disabled?: boolean;
}

export function IdeationQuestionCard({
  question,
  step,
  total,
  value,
  onChange,
  onContinue,
  onSkip,
  disabled,
}: IdeationQuestionCardProps) {
  return (
    <section className="rounded-xl border border-[var(--accent)]/40 bg-[var(--card)] p-5 space-y-4">
      <p className="text-xs uppercase tracking-wide text-[var(--accent)]">
        Ideation · {step}/{total}
      </p>
      <h2 className="text-lg font-semibold leading-snug">{question.text}</h2>
      <textarea
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-sm focus:border-[var(--accent)] focus:outline-none"
        rows={4}
        placeholder={question.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={disabled || (!question.optional && value.trim().length < 8)}
          onClick={onContinue}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-black transition hover:bg-white disabled:opacity-40"
        >
          Continue
        </button>
        {question.optional && onSkip ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onSkip}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
          >
            Skip
          </button>
        ) : null}
      </div>
    </section>
  );
}
