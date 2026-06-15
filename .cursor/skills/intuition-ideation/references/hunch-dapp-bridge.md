# Hunch — pont skill ↔ dapp

**Hunch** est la dapp d'idéation Intuition (ce repo). La skill et le dapp partagent le même protocole en 5 étapes.

## Correspondance des étapes

| Étape skill | Page dapp | API / données |
|-------------|-----------|---------------|
| 1. Describe & Search | `/brainstorm` (intent → similar) | `POST /api/brainstorm/similar`, GraphQL, `gh search`, `gatherResearchContext` |
| 2. Brainstorm & Draft | `/brainstorm` (questions → synthèse) | 5 questions = `src/lib/ideas/ideation-questions.ts`, `POST /api/brainstorm/synthesize` |
| 3. Challenge | `/brainstorm` (écran Challenge) | `POST /api/brainstorm/challenge` |
| 4. GitHub | `/prepare/[slug]` | `POST /api/publish/github-pr`, `buildPublishPlan` |
| 5. Intuition onchain | `/prepare/[slug]` | `POST /api/publish/onchain/preview`, `POST /api/publish/onchain` |

Entrées alternatives (même moteur, autre porte) :

- **Random** : `/random` — idée catalogue + état onchain
- **Cartes** : `/pick` — filtre catalogue (legacy)
- **Catalogue** : `/ideas`, `/ideas/[slug]`

## Contrat partagé : BrainstormDraft

Stockage navigateur (dapp) : `localStorage` clé `brainstorm-draft:{slug}`

Idées libres créées dans le dapp : slug `free-*`, idée dans `free-idea:{slug}`.

Fichier local (skill) : `idea-draft-[slug].md` — même contenu sémantique.

Champs : `problem`, `solution`, `users`, `intuitionFit`, `mvp`, `risks`, `challenge`, `supportTriples`, `archetype`.

## Handoff skill → dapp

Quand l'utilisateur a terminé Step 3 (Challenge) dans la skill :

1. Proposer d'ouvrir **Hunch** : `http://localhost:3000/brainstorm` (ou l'URL déployée).
2. Ou coller le draft JSON dans Prepare si slug catalogue connu : `/prepare/{slug}`.
3. Pour une idée libre : l'utilisateur doit d'abord finir le flux `/brainstorm` dans le dapp (crée `free-*` + localStorage), puis `/prepare/free-...`.

## Handoff dapp → skill

Si l'utilisateur a commencé dans Hunch :

1. Demander le **slug** et si c'est catalogue ou `free-*`.
2. Demander de coller le contenu de synthèse ou export `brainstorm-draft` depuis DevTools → Application → Local Storage.
3. Reprendre à **Step 3 Challenge** si synthèse faite sans challenge, sinon **Step 4 GitHub**.

## Preflight (comme le dapp)

Avant Step 2, si repo local disponible :

```bash
# Catalogue local
node -e "const d=require('./data/normalized/ideas.json'); console.log(d.ideas.length,'ideas')"

# État idée (catalogue)
curl -s "http://localhost:3000/api/idea-state/{slug}?verifyOnchain=true" | head -c 2000

# Similar (intent)
curl -s -X POST http://localhost:3000/api/brainstorm/similar \
  -H "Content-Type: application/json" \
  -d '{"intent":"GPS historique culturel avec débats"}'
```

GraphQL testnet (overlap) : voir `references/intuition-protocol-skill.md`.

## Scénarios de test manuel (skill)

Copier chaque prompt dans une **nouvelle conversation** avec la skill active.

### A — Idée libre (parcours complet)

> J'ai une idée pour Intuition : une app GPS qui raconte l'histoire culturelle des lieux, avec débats communautaires sur les faits historiques. Guide-moi avec Hunch / la skill idéation.

**Attendu** : barre 5 étapes, Step 1 recherche similarité, Step 2 cinq questions une par une, synthèse structurée, Step 3 challenge (objection + contre-direction + verdict), proposition Prepare/GitHub/onchain.

### B — Idée aléatoire catalogue

> Donne-moi une idée au hasard du catalogue onchain et vérifie son état GitHub et onchain.

**Attendu** : pioche dans `ideas.json`, badges scoped/PR/atom, pas traitée comme idée finie.

### C — Reprise depuis le dapp

> J'ai fini le brainstorm dans Hunch sur une idée libre. Slug : free-histoirevue-xxxx. Voici mon draft : [coller JSON BrainstormDraft]. Aide-moi pour la PR et l'onchain.

**Attendu** : Step 4 format GitHub, Step 5 preview coûts ou CLI fallback.

### D — Idée déjà onchain

> L'idée catalogue stake-review a déjà un atom. Que faire pour Step 5 ?

**Attendu** : ne pas recréer atom/triple, rapporter term_ids, staking optionnel.

## Validation automatisée

```bash
pnpm check:skill          # fichiers + sections SKILL.md + données 3A
pnpm test:skill-journey   # smoke tests locaux du parcours (sans OpenAI)
```

Le dev server (`pnpm dev`) doit tourner pour les appels API localhost dans `test:skill-journey`.
