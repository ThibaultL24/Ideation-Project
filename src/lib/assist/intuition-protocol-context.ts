// src/lib/assist/intuition-protocol-context.ts
/** Extrait protocolaire injecté dans le prompt triples (skill Intuition + migration idées). */

import {
  BOUNTY_PREDICATE_LABEL,
  INTUITION_PROTOCOL_OBJECT_LABEL,
} from "@/lib/intuition/config";

export const TRIPLE_PROTOCOL_CONTEXT = `
## Intuition Protocol — semantic rules for product ideas (read before writing)

### Atoms
- One atom = ONE named entity (short label, typically 2–6 words). Not a sentence. Not "X and Y".
- Idea atoms use the product title as label (matches migrated catalogue ideas).
- Predicates and objects are also atoms. Prefer reusing existing labels from graphContext.

### Triples
- Structure: [Subject atom] [Predicate atom] [Object atom]. All three must be nameable entities.
- Each triple has a vault; staking signals agreement. Counter-triple exists for disagreement.
- Do NOT invent term_id. Only reuse labels visible in graphContext.

### Mandatory core triple (bounty / ecosystem standard)
Every project idea in this workshop MUST include exactly this core claim:
  [Idea Title] → ${BOUNTY_PREDICATE_LABEL} → ${INTUITION_PROTOCOL_OBJECT_LABEL}
- Never change the predicate or object labels for the core triple.
- The subject MUST be the idea title (same spelling as ideaBrief.title / catalog atom).
- This is the same triple pattern used for the 300+ migrated catalogue ideas.

### Support triples (2–4 max)
Purpose: document how the product uses the knowledge graph in the PR — not on-chain publish from workshop.
Good patterns (reuse predicates from graphContext.popularPredicates when possible):
  - [Idea] → targets → [specific user segment]
  - [Idea] → solves → [concrete problem, short noun phrase]
  - [Idea] → built for → [ecosystem or vertical]
  - [Idea] → uses → [mechanism: attestations, staking, reputation signal]
  - [Idea] → has feature → [one concrete capability]

Bad patterns (reject):
  - Vague predicates: "is good", "has quality", "is innovative", "related to"
  - Objects that are full sentences or paragraphs
  - Duplicating the core triple with different wording
  - Generic objects: "early adopters", "users", "blockchain" without specificity
  - More than 4 support triples or more than 2 nested triples

### Nested triples (0–2, rare)
Only when a claim itself must be attested (provenance, meta-claim). Example:
  [Sub-claim] → attests → [Another triple as subject]
Default: return empty nestedTriples.

### Predicate hygiene (from protocol docs)
- Prefer predicates already used on testnet/mainnet (see popularPredicates, existingSubjectTriples).
- Avoid TextObject-only legacy predicates; prefer Thing-type canonical atoms.
- Predicates: 1–3 words, stable English labels.

### When graphContext says coreTriple.exists
Note in protocolNotes that the bounty triple may already exist on-chain — still document it in the PR.

### Output goal
Produce triples a human can paste into a GitHub README and that match how Intuition Portal / migration scripts model ideas.
`.trim();
