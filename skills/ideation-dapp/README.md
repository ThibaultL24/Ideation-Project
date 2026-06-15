# ideation-dapp

Skill IA **compagnon** de `intuition-ideation` — comportement de la dapp Ideation (Intuition Protocol).

## Relation entre les skills

```
intuition-ideation          ideation-dapp
     │                           │
     ├─ ton & 5 étapes  ◄───────┤ (même barre de progression)
     ├─ idea-template            ├─ routes /brainstorm, /ideas
     ├─ github format            ├─ BrainstormDraft + linter
     └─ onchain Step 5           ├─ OAuth PR utilisateur
                                 └─ scoped / API / bounty 3B
```

## Installation

```bash
npx skills add <org>/Ideation-Project --skill ideation-dapp
# + intuition-ideation recommandé
```

Voir [INSTALL.md](INSTALL.md) et [SKILL.md](SKILL.md).

## Source canonique

- Développement Cursor : `.cursor/skills/ideation-dapp/`
- Publication agent-skills : ce dossier `skills/ideation-dapp/`

Synchroniser après modification :

```bash
cp -r .cursor/skills/ideation-dapp skills/
```
