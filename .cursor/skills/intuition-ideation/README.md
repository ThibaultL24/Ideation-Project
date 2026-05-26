# Intuition Ideation Skill (vendored)

Copie locale du dépôt upstream :

**https://github.com/intuition-box/intuition-ideation-skill**

Licence MIT. Pour contribuer en amont, ouvrir une PR sur le repo `intuition-box`.

## Emplacement Cursor

```
.cursor/skills/intuition-ideation/
├── SKILL.md
├── assets/workflow-overview.png
└── references/
    ├── intuition-protocol-skill.md
    ├── intuition-basics.md
    ├── idea-template.md
    └── github-submission-format.md
```

Cursor charge automatiquement les skills du dossier `.cursor/skills/` du projet.

## Déclencheurs (exemples)

- « J'ai une idée pour Intuition »
- « Brainstormer un concept produit »
- « Publier mon idée onchain »

## Dépendances optionnelles

| Outil | Usage |
|-------|--------|
| [Intuition Protocol skill](https://github.com/0xIntuition/agent-skills) | Étape 5 — publication onchain |
| [GitHub CLI](https://cli.github.com/) | Étape 4 — PR sur intuition-box/ideas |

Installation upstream :

```bash
npx skills add intuition-box/intuition-ideation-skill
```

Ce projet inclut déjà le skill en local ; la commande ci-dessus n'est pas nécessaire.

## Lien avec la dApp

Ce repo (`IdeationProject`) implémente le pipeline de publication (catalogue, explorer, scripts `pnpm publish:one`, etc.). Le skill guide la conversation ; la dApp exécute la partie technique.
