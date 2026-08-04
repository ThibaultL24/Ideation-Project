# Hunch — Intuition Ideation Dapp

Web app for the [Intuition Protocol](https://intuition.systems) ecosystem: brainstorm product ideas, stress-test them with AI, open GitHub PRs to the ideas catalog, and publish on-chain attestations (atoms + core triples).

Built with **Next.js 15**, **wagmi/viem**, and **@0xintuition/sdk**.

## Features

- **Guided brainstorm** — describe an idea, optional catalog search, AI synthesis & challenge
- **Free-form path** — start a new idea without picking a catalog card
- **GitHub publication** — OAuth per user: fork → branch → PR into `intuition-box/ideas`
- **On-chain publish** — atom + core triple on Intuition testnet or mainnet
- **Wallet panel** — connect a wallet to sign attestations

## Quick start

```bash
cp .env.example .env
# Edit .env — see Environment below

npm install
npm run dev
```

Open the URL from your terminal (e.g. `http://localhost:3000`, or the port Cursor forwards in WSL).

Verify resolved config:

```bash
npm run env:check
```

## Environment

Full reference: **[`.env.example`](.env.example)** (commented for intuition-box maintainers).

| Variable | Purpose |
|----------|---------|
| `INTUITION_NETWORK` | **Single switch** — `testnet` (dev) or `mainnet` (prod). RPC, explorer, portal, and wallet follow automatically. |
| `NEXT_PUBLIC_APP_URL` | Public dapp URL — must match GitHub OAuth App settings |
| `GITHUB_TARGET_REPO` | Upstream catalog — **`intuition-box/ideas`** in production |
| `GITHUB_BASE_BRANCH` | PR target branch — **`main`** in production |
| `GITHUB_OAUTH_CLIENT_ID` / `SECRET` | GitHub OAuth App for user PRs |
| `SESSION_SECRET` | Signs httpOnly session cookies (≥ 16 chars) |
| `OPENAI_API_KEY` | AI brainstorm (optional if `ASSIST_ENABLED=false`) |
| `INTUITION_PRIVATE_KEY` | Optional — migration scripts only (dapp users pay with their wallet) |

### Network switch

```env
# Development
INTUITION_NETWORK=testnet

# Production
INTUITION_NETWORK=mainnet
```

Restart the dev server after changing network. The browser wallet picks up `INTUITION_NETWORK` via `next.config.ts` (no need to duplicate `NEXT_PUBLIC_*` unless overriding).

### GitHub OAuth (production deploy)

For the official **intuition-box** deployment:

1. Create a [GitHub OAuth App](https://github.com/settings/developers)
   - **Homepage URL** → `NEXT_PUBLIC_APP_URL`
   - **Callback URL** → `{NEXT_PUBLIC_APP_URL}/api/auth/github/callback`
2. Set `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, `SESSION_SECRET`
3. Set `GITHUB_TARGET_REPO=intuition-box/ideas` and `GITHUB_BASE_BRANCH=main`

Contributor flow: sign in with GitHub → app forks `intuition-box/ideas` to `{username}/ideas` → PR opened against `main`.

**Local dev without org access:** override `GITHUB_TARGET_REPO` to your own fork (see commented block in `.env.example`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run check` | Typecheck + lint + tests (CI-style gate) |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run lint` | ESLint (Next.js strict + TypeScript) |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |
| `npm run env:check` | Print resolved network + GitHub config |
| `npm run test` | Run Vitest |
| `npm run import:ideas` | Import ideas catalog |
| `npm run verify:onchain` | Verify on-chain state |
| `npm run verify:graphql` | Bounty 3A — GraphQL queryability (atoms + triples) |
| `npm run verify:migration` | Bounty 3A — on-chain + GraphQL full check |
| `npm run migrate:batches` | Bounty 3A — batch atom + triple migration |
| `npm run feasibility:3a` | Bounty 3A — cost & SDK dry checks |

## Bounty 3A — Migrate Ideas Onchain

Official mission (four steps) and how this repo implements them:

| Mission step | Repo implementation | Status (testnet) |
|--------------|---------------------|------------------|
| 1. Parse ~300 dApp ideas from Notion | Export → `data/raw/ideas.txt`, then `npm run import:ideas` → `data/normalized/ideas.json` (362 after normalize/dedupe) | Done |
| 2. Create an atom per idea | `INTUITION_PRIVATE_KEY` + `npm run migrate:batches` (SDK batch in `src/lib/intuition/batch-publish.ts`) | Done — reports under `data/reports/migration-batch-sdk-*.json` |
| 3. Core triple per idea | `[Idea] — top project ideas for — Intuition` (on-chain object term: Intuition Protocol atom `0xda797f…`) | Done — 362 triples |
| 4. Verify GraphQL queryability | `INTUITION_NETWORK=testnet npm run verify:graphql` | Done — `migration-verify-graphql.json` → `ok: true` |

**Core triple (always):**

```
[Idea Title] — top project ideas for — Intuition
```

On-chain, subject = idea atom, predicate = `top project ideas for`, object = canonical Intuition Protocol term ID (same on mainnet and testnet).

**Re-run verification:**

```bash
export INTUITION_NETWORK=testnet
npm run verify:graphql      # GraphQL only (fast)
npm run verify:migration    # RPC on-chain + GraphQL (slower)
```

**Re-migrate a slice (requires funded server wallet):**

```bash
npm run migrate:batch -- --sdk-batch --offset=0 --limit=50
```

Catalog migration uses `catalogIdeaToPinThing` (stable metadata). The dapp brainstorm path uses `ideaToPinThing` with a variant fingerprint so user iterations can mint distinct atoms without colliding with the catalog.

**Mainnet notes**

- Set `INTUITION_NETWORK=mainnet` and `INTUITION_RPC_URL=https://rpc.intuition.systems/http`.
- Mainnet GraphQL is read-only — IPFS pinning uses testnet GraphQL (`pinThingForNetwork`); atom term IDs stay identical.
- Fund the server wallet with **~72 TRUST** for 362 ideas (~0.2 TRUST per idea: atom + triple).
- Preflight: `npm run mainnet:preflight`
- After migration: `npm run verify:graphql` and `npm run verify:migration`
- Catalog UI (`/ideas`, `/random`) reads the **on-chain GraphQL slice** first (120s cache), enriched from `ideas.json`; falls back to JSON if the graph is empty on the active network.
- API: `GET /api/catalog` — same list as JSON for agents and tooling.

## Code organization

For a new contributor, start here:

```
src/
  app/                    # Next.js App Router — pages + API only
    api/
      auth/github/        # OAuth login, callback, session
      brainstorm/         # AI: similar, synthesize, challenge
      publish/            # GitHub PR + on-chain publish
      idea-state/         # Scoped / on-chain status per slug
  components/
    brainstorm/           # Ideation UI (flow, workspace, publish)
    wallet/               # Wagmi connect panel
    github/               # OAuth panel
    layout/               # App shell (header)
  lib/
    ideas/                # Catalog, drafts, publish-plan (active dapp path)
    intuition/            # Protocol: config, GraphQL, atoms, triples
    assist/               # OpenAI prompts + local fallbacks
    auth/                 # GitHub session cookies
    env/                  # INTUITION_NETWORK, GitHub env
    strings/              # UI copy (English)
    workshop/             # Legacy research pipeline (used by some API routes)
```

**Conventions**

- Import alias: `@/` → `src/`
- Domain logic lives in `lib/`, not in route handlers or components
- UI strings in `lib/strings/` — avoid hard-coded copy in components
- File header: `// src/path/to/file.ts` on new modules
- Deep imports preferred over barrels (`@/lib/ideas/load`, not `@/lib/ideas`)
- Active user flow: `ideas/` + `components/brainstorm/` — `workshop/` is secondary

**Quality gate before PR**

```bash
npm run check
npm run format:check
```

## Project layout

```
src/
  app/              # Next.js routes (brainstorm, ideas, API)
  components/       # UI (brainstorm flow, wallet, GitHub auth)
  lib/
    env/            # Network + GitHub env helpers
    intuition/      # Protocol config, GraphQL, publish
    assist/         # OpenAI prompts & fallbacks
    auth/           # GitHub OAuth session
skills/             # Agent skills (ideation-dapp, published copy)
data/               # Normalized ideas catalog
```

## Agent skills

Cursor skills live in `.cursor/skills/`. Published copies are under `skills/`.

- **intuition-ideation** — 5-step ideation workflow
- **ideation-dapp** — dapp-accurate routes, OAuth PR, BrainstormDraft

See [`skills/ideation-dapp/README.md`](skills/ideation-dapp/README.md).

## Deploy checklist (intuition-box)

- [ ] `INTUITION_NETWORK=mainnet`
- [ ] `NEXT_PUBLIC_APP_URL` = production domain
- [ ] GitHub OAuth App callback matches production URL
- [ ] `GITHUB_TARGET_REPO=intuition-box/ideas`, `GITHUB_BASE_BRANCH=main`
- [ ] `SESSION_SECRET` — strong random value
- [ ] `OPENAI_API_KEY` — for AI assist
- [ ] Users fund their own wallets with TRUST to publish on-chain (no server key required for the UI)
- [ ] Run `npm run env:check` before go-live

## License

Private — Intuition ecosystem. See repository owners for terms.
