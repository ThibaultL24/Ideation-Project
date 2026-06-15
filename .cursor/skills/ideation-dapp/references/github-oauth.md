# Publication PR — OAuth GitHub (modèle utilisateur)

## Principe

Chaque utilisateur publie **en son nom** :

1. Connexion OAuth (`scope: public_repo`)
2. Fork automatique `intuition-box/ideas` → `{login}/ideas` si absent
3. Branche + fichier README sur **son fork**
4. PR vers `intuition-box/ideas` (`head: {login}:{branch}`)

Le token reste dans un **cookie httpOnly signé** (`SESSION_SECRET`) — jamais exposé au JavaScript client.

## Routes auth

| Route | Méthode | Rôle |
|-------|---------|------|
| `/api/auth/github/login?returnTo=` | GET | Redirige vers GitHub OAuth |
| `/api/auth/github/callback` | GET | Échange code, crée session |
| `/api/auth/github/session` | GET | `{ connected, login, publishRepo }` |
| `/api/auth/github/logout` | POST | Supprime session |

## Variables serveur (dapp déployée)

```env
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
SESSION_SECRET=                    # ≥ 16 caractères aléatoires
GITHUB_TARGET_REPO=intuition-box/ideas
GITHUB_BASE_BRANCH=main
# GITHUB_OAUTH_CALLBACK_URL=      # optionnel, défaut {APP_URL}/api/auth/github/callback
```

## Créer l’OAuth App GitHub

1. [GitHub Developer Settings](https://github.com/settings/developers) → New OAuth App
2. Homepage URL : `NEXT_PUBLIC_APP_URL`
3. **Authorization callback URL** : doit correspondre **exactement** à `GITHUB_OAUTH_CALLBACK_URL` ou `{APP_URL}/api/auth/github/callback`
4. Copier Client ID + générer Client Secret

## Flux UI (section publication)

1. Panneau « Se connecter avec GitHub »
2. Bouton « Ouvrir une PR GitHub » activé si `connected: true`
3. `POST /api/publish/github-pr` avec session cookie
4. Succès → ouverture PR + Markdown copié
5. `401 auth_required` → redirection login avec `returnTo` vers la page brainstorm `#publication`

## Fallback serveur (admin / dev)

Si `GITHUB_TOKEN` + `GITHUB_PUBLISH_REPO` sont définis **et** aucune session utilisateur :

- PR créée au nom du compte bot (outil interne uniquement)
- Ne pas utiliser en prod publique à la place d’OAuth

## Mode manuel (sans OAuth configuré)

- Markdown copié dans le presse-papiers
- Lien éditeur : `https://github.com/intuition-box/ideas/new/main?filename=ideas/...`
- Commandes `gh` dans `plan.fallbackCommands`

## Atoms

La dapp **ne crée pas** les atoms à l’étape PR. Pipeline attendu :

```
PR mergée → GitHub Action / script org → atoms + triple cœur sur testnet/mainnet
```
