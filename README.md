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
| `INTUITION_PRIVATE_KEY` | Server wallet for on-chain publish (optional) |

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
| `npm run env:check` | Print resolved network + GitHub config |
| `npm run test` | Run Vitest |
| `npm run import:ideas` | Import ideas catalog |
| `npm run verify:onchain` | Verify on-chain state |

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
- [ ] Fund server wallet with TRUST if using `INTUITION_PRIVATE_KEY`
- [ ] Run `npm run env:check` before go-live

## License

Private — Intuition ecosystem. See repository owners for terms.
