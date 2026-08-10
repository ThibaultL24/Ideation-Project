// src/lib/strings/ideation-actions.ts

export const ideationActionStrings = {
  sectionTitle: "What does your idea need before publication?",
  sectionLead:
    "Each helper produces suggestions for the draft below. Apply them to pre-fill empty fields, then edit. Nothing is published from this step.",
  howToUseTitle: "How to use a helper",
  howToUse:
    "1) Click Generate → 2) Read the analysis → 3) Keep the checkboxes you want → 4) Apply selected suggestions into the draft.",
  generate: "Generate",
  regenerating: "Generating…",
  regeneratingHint: "Keep this tab open — your draft stays saved locally.",
  acceptSelected: "Apply selected suggestions",
  rejectResult: "Reject result",
  regenerate: "Regenerate",
  chooseAnother: "Choose another action",
  continuePublish: "Continue to publication",
  fallbackUsed:
    "Offline helper used (AI unavailable). Review carefully before applying.",
  openaiUsed: "Generated with AI assistance.",
  optionalChallenge: "Optional — best after a first elaboration.",
  currentVersion: "Active draft version",
  historyTitle: "What changed in your draft",
  historyEmpty:
    "No applied helpers yet. When you apply suggestions, versions appear here so you can see how the idea evolved.",
  conflictTitle: "Confirm replacements",
  conflictLead: "These fields already have content. Confirm before overwriting.",
  currentValue: "Current",
  proposedValue: "Proposed",
  confirmOverwrite: "Overwrite confirmed fields",
  applyEmptyOnly: "Apply only empty fields",
  selectSuggestion: "Apply",
  noSuggestions:
    "No draft field suggestions — use the analysis above, then edit manually if needed.",
  resultStatus: {
    generated: "Generated",
    accepted: "Accepted",
    rejected: "Rejected",
  },
  importTitle: "Import from Intuition Ideation Skill (optional)",
  importLead:
    "If you already structured an idea in the conversational skill, paste the JSON here. Preview first — nothing is published automatically.",
  importPlaceholder:
    '{ "version": 1, "source": "intuition-ideation-skill", ... }',
  importPreview: "Preview import",
  importConfirm: "Import into draft",
  importCancel: "Cancel",
  importError: "Could not import",
  meaningfulChange:
    "This has become meaningfully different from the original idea. Do you want to keep it as a new variant? (Full variant management is out of scope for this prototype — keep refining the current draft or start a new free-form idea.)",
  requiresDraft:
    "Fill a bit more of the draft first (problem or solution), then run this action.",
} as const;
