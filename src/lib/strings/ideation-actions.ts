// src/lib/strings/ideation-actions.ts

export const ideationActionStrings = {
  sectionTitle: "What does your idea need before publication?",
  sectionLead:
    "Choose where you need help. Every step improves the same Intuition proposal.",
  generate: "Generate",
  regenerating: "Generating…",
  regeneratingHint: "Keep this tab open — your draft stays saved locally.",
  acceptSelected: "Apply selected suggestions",
  rejectResult: "Reject result",
  regenerate: "Regenerate",
  chooseAnother: "Choose another action",
  continuePublish: "Continue to publication",
  fallbackUsed: "Offline helper used (AI unavailable). Review carefully before applying.",
  openaiUsed: "Generated with AI assistance.",
  optionalChallenge: "Optional — best after a first elaboration.",
  currentVersion: "Active version",
  historyTitle: "Idea evolution",
  historyEmpty:
    "No accepted changes yet — generate and apply a result to start the timeline.",
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
  importTitle: "Already developed your idea with the Intuition Ideation Skill?",
  importLead: "Paste your structured idea here to continue preparing it for publication.",
  importPlaceholder: '{ "version": 1, "source": "intuition-ideation-skill", ... }',
  importPreview: "Preview import",
  importConfirm: "Import into draft",
  importCancel: "Cancel",
  importError: "Could not import",
  meaningfulChange:
    "This has become meaningfully different from the original idea. Do you want to keep it as a new variant? (Full variant management is out of scope for this prototype — keep refining the current draft or start a new free-form idea.)",
  requiresDraft:
    "Fill a bit more of the draft first (problem or solution), then run this action.",
} as const;
