# Intuition Ideation dApp — Mission 03

Pipeline de publication fiable + dApp de contrôle pour migrer et exploiter les 300+ idées **Build on Intuition**.

## Livrables

| Code | Objectif | État Sprint 1 |
|------|----------|---------------|
| **3A** | Migration 300 idées → Markdown, IPFS JSON, atoms/triples | Pipeline data + dry-run |
| **3B** | dApp idéation (liste, random, détail, admin) | UI MVP squelette |
| **3C** | Skill `/intuition` amélioré | Sprint 4 |

## Démarrage rapide

```bash
pnpm install
pnpm import:ideas      # parse + normalise → data/normalized/ideas.json
pnpm migrate:dry-run   # génère Markdown, JSON IPFS, rapport
pnpm test
pnpm dev               # http://localhost:3000
```

## Structure

```
data/
  raw/ideas.txt              # export PDF
  normalized/ideas.json      # idées canoniques
  normalized/markdown/       # fiches GitHub générées
  normalized/ipfs/           # JSON canoniques IPFS
  reports/migration-report.json

src/lib/ideas/               # parser, normalizer, dedupe, markdown, ipfs
scripts/                     # import, dry-run, migrate-batch (Sprint 2)
```

## Modèle d’idée

Chaque idée suit le schéma `Idea` : `canonicalId`, `slug`, métadonnées, statut (`draft` → `verified`), slots `github`, `ipfs`, `intuition`.

Publication onchain (Sprint 2) :

1. JSON canonique → pin IPFS → `ipfs://...`
2. `createAtoms` avec URI encodée (pas titre brut)
3. Triples : `[Idea] → top project ideas for → [Intuition]`, plus `is-a` / `built-on`

Chemin GitHub correct : `ideas/YYYY-MM-DD-slug/README.md` (pas `ideas/slug.md`).

## Mission 3A — Intuition onchain (`@0xintuition/sdk`)

Aligné avec la [doc SDK officielle](https://www.docs.intuition.systems/docs/quick-start/using-the-sdk) :

- `configureClient({ apiUrl })` — requis : le SDK `pinThing` cible mainnet par défaut

- `pinThing` → `createAtomFromIpfsUri` / `createAtomFromThing`
- `createTripleStatement` pour `[Idea] → top project ideas for → Intuition Protocol`
- `batchCreateAtomsFromIpfsUris` pour migration par chunks (évite double pin)

```bash
cp .env.example .env
# INTUITION_PRIVATE_KEY + tTRUST (faucet testnet sur app.intuition.systems)

pnpm feasibility:3a
pnpm publish:one stake-review              # 1 idée (SDK)
pnpm migrate:batch -- --limit=25 --sdk-batch  # batch gas-efficient
pnpm verify:onchain 0x...
```

Coût testnet : ~0.003 tTRUST / idée.

## Agent skill (Cursor)

Le skill [intuition-ideation-skill](https://github.com/intuition-box/intuition-ideation-skill) est vendored dans le projet :

```
.cursor/skills/intuition-ideation/
```

Workflow en 5 étapes : décrire → brainstorm → challenge → GitHub PR → publication Intuition. Voir `.cursor/skills/intuition-ideation/README.md`.

## Prochaines étapes

- Sprint 2 : Octokit (PR GitHub) + batch 362 + rapport final
- Sprint 3 : wallet UI dans la dApp
- Sprint 4 : mise à jour skill + déploiement
