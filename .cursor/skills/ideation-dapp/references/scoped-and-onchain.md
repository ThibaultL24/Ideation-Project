# État scoped & onchain

## IdeaDbState (catalogue local)

```ts
{
  scoped: boolean      // idée « engagée » dans le flux publication
  hasGithubPath: boolean
  hasGithubPr: boolean
  status: IdeaStatus   // draft | normalized | github_published | onchain | ...
}
```

**Scoped** si statut dans la liste bounty OU `github.path` OU `github.prUrl`.

Statuts scoped : `github_ready`, `github_published`, `ipfs_pinned`, `atom_created`, `triples_created`, `verified`, `published`, `onchain`.

## IdeaOnchainState (vérification GraphQL)

```ts
{
  atomId: string | null
  atomInIndexer: boolean
  coreTriplePresent: boolean
  network: "mainnet" | "testnet"
}
```

- `atomId` : depuis `idea.intuition.atomId` ou `data/reports/migration-batch-sdk-retry.json`
- `atomInIndexer` : atom queryable via GraphQL
- `coreTriplePresent` : triple `[atomId] — top project ideas for — Intuition` présent

## Prédicat & objet

- Prédicat : label `top project ideas for`
- Objet testnet : recherche atom `Intuition Protocol`
- Objet mainnet : term ID fixe `0xda797f4aa19c2b129bd3a33cdb8d260b94672fcdb295d04e2533dc02a994a3d8`

## Next actions (`resolveNextAction`)

| Condition | Action |
|-----------|--------|
| PR + atom + triple | `view_ready` |
| PR sans atom/triple complet | `prepare_onchain` (côté org, pas dapp) |
| Atom sans PR | `sync_db` |
| Scoped sans PR | `brainstorm` |
| Sinon | `create_with_prompt` |

## Réseaux Intuition

| | Mainnet | Testnet |
|---|---------|---------|
| Chain ID | 1155 | 13579 |
| GraphQL | `https://mainnet.intuition.sh/v1/graphql` | `https://testnet.intuition.sh/v1/graphql` |
| Explorer | explorer.intuition.systems | testnet.explorer.intuition.systems |
| Portal | portal.intuition.systems | testnet.portal.intuition.systems |

Bounty 3A (ce repo) : migration **testnet** 362/362 vérifiée (`migration-verify-complete.json` → `ok: true`).

## Requête GraphQL — atoms par label

```graphql
query ($pattern: String!) {
  atoms(where: { label: { _ilike: $pattern } }, limit: 10) {
    term_id
    label
    vault { totalShares }
  }
}
```

`pattern` = `%keyword%`

## Règle pour l’IA

- **Ne pas** recréer atom/triple si déjà présents — rapporter les IDs et le lien explorer.
- **Ne pas** promettre onchain depuis la dapp utilisateur ; expliquer le flux post-merge PR.
- Toujours distinguer **catalogue JSON** (intention produit) et **indexeur** (vérité onchain live).
