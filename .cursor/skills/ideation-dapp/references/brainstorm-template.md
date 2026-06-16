# Brouillon brainstorm & README PR

Ce fichier complète `../intuition-ideation/references/idea-template.md` avec les **champs exacts** de la dapp (`BrainstormWorkspace` + `buildPublishPlan`).

## Champs BrainstormDraft → questions utilisateur

| Champ dapp | Section idea-template | Question (français) |
|------------|----------------------|---------------------|
| `problem` | Problem Statement | Qui souffre, de quoi, comment s’en sort-on aujourd’hui ? |
| `solution` | Proposed Solution | Que fait le produit ? Parcours en 3 étapes. |
| `users` | Target Users | Les 100 premiers utilisateurs, précisément. |
| `intuitionFit` | Intuition Integration | Atoms, triples, staking — qu’est-ce qui est indispensable ? |
| `mvp` | What Would Need to Be Built | 3 écrans ou workflows pour un hackathon. |
| `risks` | Strengths & Risks | Redondance, cold start, UX crypto. |
| `challenge` | (étape 3 skill) | Pourquoi ça pourrait échouer ? Que prouver ? |
| `supportTriples` | — | Une ligne par triple : `Sujet -> prédicat -> objet` |

## Archétypes (boutons UI)

| ID | Label dapp | Quand le proposer |
|----|------------|-------------------|
| `curated-list` | Liste curée | Classer, recommander, découvrir |
| `reputation` | Réputation | Avis, scores, confiance |
| `social-attestation` | Attestations | Preuves entre pairs |
| `risk-detection` | Risque | Fraude, sécurité, alertes |
| `prediction-signal` | Signal | Marchés, prédiction |
| `agent-memory` | Agents IA | Mémoire, contexte, RAG |

## README généré (`buildPublishPlan`)

Chemin : `ideas/{YYYY-MM-DD}-{slug}/README.md` — voir aussi `../intuition-ideation/references/github-submission-format.md`.

Frontmatter dapp :

```yaml
---
title: "..."
tagline: "..."
category: "..."
canonicalId: "..."
status: "proposed"
archetype: "..."
source: "intuition-ideation-dapp"
---
```

Sections : Problem, Proposed Solution, Target Users, Intuition Integration, MVP, Challenge Notes, Core Triple, Support Triple Suggestions (optionnel).

## Corps PR

Identique à `intuition-ideation` Step 4 : Summary, Intuition Integration, Publish Plan (chemin, label atom, triple cœur).

## Linter — traduction pour l’utilisateur

| Message technique | Message utilisateur (exemple) |
|-------------------|-------------------------------|
| Problem statement is still thin. | Le problème mérite encore quelques phrases concrètes. |
| Solution journey needs more detail. | Décris le parcours utilisateur en un peu plus de détail. |
| Intuition integration should name atoms, triples, or signal. | Explique comment Intuition (atoms, triples ou staking) est central. |
| Target users should be more specific. | Précise qui sont tes premiers utilisateurs. |

## Fallback `gh`

Voir `intuition-ideation` Step 4b ou `plan.fallbackCommands` renvoyé par l’API `/api/publish/github-pr`.
