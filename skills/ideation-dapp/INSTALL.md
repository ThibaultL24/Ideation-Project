# Installer le skill Ideation Dapp

Skill **compagnon** de `intuition-ideation` : même workflow 5 étapes, comportement calé sur la dapp Ideation.

## Prérequis recommandés

Installer **les deux** skills ensemble :

```bash
npx skills add <org>/Ideation-Project --skill intuition-ideation
npx skills add <org>/Ideation-Project --skill ideation-dapp
```

| Skill | Rôle |
|-------|------|
| `intuition-ideation` | Ton, 5 étapes conversationnelles, template idée, format GitHub, onchain détaillé |
| `ideation-dapp` | Routes dapp, BrainstormDraft, OAuth PR, scoped, API, règles bounty 3B/3C |

Optionnel : `npx skills add 0xintuition/agent-skills --skill intuition` (GraphQL, atoms).

## Cursor

```
.cursor/skills/ideation-dapp/SKILL.md
```

La rule `intuition-ideation-always` charge déjà `intuition-ideation` ; invoquer explicitement `ideation-dapp` pour le travail sur la dapp ou le code applicatif.

## Claude Project

**Instructions** : `SKILL.md` + indiquer de lire d’abord `intuition-ideation/references/intuition-protocol-skill.md`.

**Knowledge** : uploader `references/` de **ideation-dapp** et `references/` de **intuition-ideation**.

## ChatGPT Custom GPT

1. Instructions : corps de `SKILL.md` (résumé si limite de caractères).
2. Knowledge : références des deux skills.
3. Préciser : français simple, barre 5 étapes, pas d’atoms depuis la dapp.

## Variables (dapp déployée uniquement)

```env
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
SESSION_SECRET=
NEXT_PUBLIC_APP_URL=
GITHUB_TARGET_REPO=intuition-box/ideas
```

Voir [references/github-oauth.md](references/github-oauth.md).
