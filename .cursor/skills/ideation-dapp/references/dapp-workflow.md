# Parcours Ideation Dapp

Aligné sur la skill `intuition-ideation` (5 étapes) et l’état actuel du code.

## Pages principales

| Route | Étape skill | Rôle |
|-------|-------------|------|
| `/ideas` | 1 | Catalogue ~362 idées (PDF source) |
| `/random` | 1 | Idée aléatoire + badges scoped/onchain |
| `/brainstorm` | 1 | Grille **24 catégories** |
| `/brainstorm/category/[slug]` | 1 | Top idées par catégorie (vault GraphQL) |
| `/brainstorm/category/.../[ideaSlug]` | 1 | Fiche atom lecture seule |
| `/brainstorm/new?category=` | 1 | Prompt + `POST /api/brainstorm/similar` |
| `/brainstorm/new/continue` | 2 | Workspace si pas de doublon fort |
| `/brainstorm/idea/[slug]` | 2–4 | Affinage + `#publication` |
| `/brainstorm/[slug]` | — | Redirect → `/brainstorm/idea/[slug]` |

**Retiré** (ne plus mentionner) : `/pick`, `/prepare` — publication intégrée en bas du brainstorm.

## Flux nouvelle idée

1. Catégorie sur `/brainstorm`
2. Prompt (≥ 3 caractères)
3. Vérif doublons — score ≥ 9 = stop
4. Slug `draft-{...}` → workspace
5. localStorage `brainstorm-draft:{slug}`
6. OAuth GitHub → PR (étape 4)

## Flux idée catalogue

1. `/ideas`, `/random`, ou catégorie populaire
2. `/brainstorm/idea/{slug}`
3. Brouillon pré-rempli depuis `description`
4. Même publication

## Workspace UI (étapes 2–4)

1. Archétype Intuition (6 choix)
2. Textareas : problème, solution, users, Intuition, MVP, risques, challenge, triples soutien
3. Linter + triple cœur (preview)
4. Enregistrer brouillon
5. **Préparer & publier** : session GitHub, PR, aperçu README

## Intention produit

| Composant | Rôle |
|-----------|------|
| Catalogue | Source normalisée bounty |
| Brainstorm | Structurer **sans** atom immédiat |
| PR GitHub | Seule soumission utilisateur vers `intuition-box/ideas` |
| Atoms | Pipeline org **après merge** (3A = catalogue testnet migré) |

## Barre de progression (afficher à l’utilisateur)

```
📍 Step 1 of 5: Describe & Search → Step 2: Brainstorm → Step 3: Challenge → Step 4: GitHub → Step 5: Intuition
```

Même libellé que `intuition-ideation` — les routes dapp sont le support concret de chaque étape.
