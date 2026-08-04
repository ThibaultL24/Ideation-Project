// src/lib/ideas/apply-ideation-suggestions.ts
import type { BrainstormDraft } from "./publish-plan";
import { normalizeBrainstormDraft } from "./publish-plan";
import type { DraftSuggestionField, IdeationActionResult } from "./ideation-actions";

export interface SuggestionConflict {
  field: DraftSuggestionField;
  currentValue: string;
  proposedValue: string;
  reason?: string;
}

export interface ApplySuggestionsInput {
  draft: BrainstormDraft;
  result: IdeationActionResult;
  /** Fields the user confirmed. Empty current fields auto-apply when listed. */
  acceptedFields: DraftSuggestionField[];
  /** When true, overwrite non-empty fields that are in acceptedFields. */
  overwriteConfirmed: boolean;
}

export interface ApplySuggestionsOutput {
  nextDraft: BrainstormDraft;
  appliedFields: DraftSuggestionField[];
  skippedConflicts: SuggestionConflict[];
  unchanged: boolean;
}

export function listSuggestionConflicts(
  draft: BrainstormDraft,
  result: IdeationActionResult,
): SuggestionConflict[] {
  const conflicts: SuggestionConflict[] = [];
  for (const suggestion of result.suggestions) {
    const current = draft[suggestion.targetField]?.trim() ?? "";
    if (current.length > 0 && current !== suggestion.proposedValue.trim()) {
      conflicts.push({
        field: suggestion.targetField,
        currentValue: current,
        proposedValue: suggestion.proposedValue,
        reason: suggestion.reason,
      });
    }
  }
  return conflicts;
}

export function applyIdeationSuggestions(
  input: ApplySuggestionsInput,
): ApplySuggestionsOutput {
  const next = { ...normalizeBrainstormDraft(input.draft) };
  const appliedFields: DraftSuggestionField[] = [];
  const skippedConflicts: SuggestionConflict[] = [];
  const accepted = new Set(input.acceptedFields);

  for (const suggestion of input.result.suggestions) {
    if (!accepted.has(suggestion.targetField)) continue;
    const field = suggestion.targetField;
    const current = next[field]?.trim() ?? "";
    const proposed = suggestion.proposedValue.trim();
    if (!proposed) continue;

    if (!current) {
      next[field] = proposed;
      appliedFields.push(field);
      continue;
    }

    if (current === proposed) {
      appliedFields.push(field);
      continue;
    }

    if (input.overwriteConfirmed) {
      next[field] = proposed;
      appliedFields.push(field);
    } else {
      skippedConflicts.push({
        field,
        currentValue: current,
        proposedValue: proposed,
        reason: suggestion.reason,
      });
    }
  }

  return {
    nextDraft: normalizeBrainstormDraft(next),
    appliedFields,
    skippedConflicts,
    unchanged: appliedFields.length === 0,
  };
}
