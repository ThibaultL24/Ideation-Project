# API & scripts — repo Ideation-Project

## Endpoints Next.js

### `GET /api/idea-state/{slug}?verifyOnchain=true`

Réponse :

```json
{
  "idea": { "...": "Idea" },
  "state": {
    "slug": "",
    "db": { "scoped": false, "hasGithubPr": false },
    "onchain": { "atomInIndexer": false, "coreTriplePresent": false },
    "nextAction": "brainstorm",
    "badges": ["catalogue"]
  },
  "prompt": "..."
}
```

### `POST /api/brainstorm/similar`

```json
{ "prompt": "wallet social", "category": "DeFi" }
```

Réponse : `catalogMatches`, `graphMatches`, `hasStrongMatch` (score ≥ 9).

### `POST /api/publish/github-pr`

```json
{
  "slug": "draft-mon-idee",
  "draft": { "problem": "...", "...": "..." },
  "idea": { "canonicalId": "...", "slug": "...", "...": "..." },
  "prompt": "...",
  "category": "DeFi",
  "returnTo": "/brainstorm/idea/draft-mon-idee#publication"
}
```

Réponses :

| `mode` | HTTP | Signification |
|--------|------|---------------|
| `created` | 200 | PR ouverte, `prUrl` |
| `manual` | 200 | OAuth absent — Markdown + lien éditeur |
| `auth_required` | 401 | `loginUrl` — utilisateur non connecté |
| `error` | 502 | Erreur GitHub API |

### `POST /api/publish/onchain`

Existe mais **non exposé dans l’UI** — atoms via PR merge uniquement.

## Scripts pnpm utiles

| Script | Rôle |
|--------|------|
| `pnpm import:ideas` | Importer / normaliser le PDF |
| `pnpm verify:migration` | Vérifier 362 atoms + triples testnet |
| `pnpm publish:one -- --slug=` | Publier un atom (opérateur, clé serveur) |
| `pnpm dev` | Dapp locale port 3000 |

## Structure code clé

| Module | Rôle |
|--------|------|
| `src/lib/ideas/publish-plan.ts` | `buildPublishPlan`, `BrainstormDraft` |
| `src/lib/ideas/resolve-publish-idea.ts` | Résolution catalogue / brouillon |
| `src/lib/ideas/idea-state.ts` | Scoped, onchain, badges |
| `src/lib/ideas/brainstorm-similarity.ts` | Doublons, `draftIdeaFromPrompt` |
| `src/lib/github/create-idea-pr.ts` | Création branche/fichier/PR |
| `src/lib/github/user-fork.ts` | OAuth, fork utilisateur |
| `src/components/brainstorm/brainstorm-workspace.tsx` | UI affinage |
| `src/components/brainstorm/brainstorm-publish-section.tsx` | UI publication |

## Schéma Idea (extrait)

```ts
{
  canonicalId: string
  slug: string
  title: string
  tagline: string
  category: string
  description: string
  tags: string[]
  status: IdeaStatus
  github?: { path?, prUrl? }
  intuition?: { atomId?, triples? }
}
```

Brouillons : `slug` préfixe `draft-`, `status: "draft"`.
