---
name: ideation-dapp
description: >
  Guides users through the Intuition Ideation Dapp with the same 5-step workflow as
  intuition-ideation, but grounded in the live app: catalogue, random, brainstorm by
  category, BrainstormDraft, duplicate detection, OAuth GitHub PR to intuition-box/ideas,
  and scoped/onchain state. Use when the user uses or builds the Ideation web app,
  bounty 3B/3C, mirrors the dapp without UI, or asks about brainstorm routes, PR
  publication, or catalogue ideas. Load with intuition-ideation; this skill is the
  dapp-accurate layer on top.
compatibility:
  tools:
    - Bash
    - Read
    - Write
    - WebFetch
  dependencies:
    - name: intuition-ideation
      note: "Required companion — conversational 5 steps, idea template, GitHub format, tone."
    - name: intuition
      install: "npx skills add 0xintuition/agent-skills --skill intuition"
      note: "GraphQL atom search (Step 1) and post-merge onchain context (Step 5)."
    - name: gh-cli
      install: "brew install gh"
      note: "Fallback PR if OAuth dapp unavailable; gh auth login required."
---

# Ideation Dapp Skill

Skill **opérateur** pour l’application **Ideation** (Intuition Protocol). Il prolonge la skill `intuition-ideation` : même parcours en **5 étapes**, même ton, mais calé sur le **code et les écrans réels** de la dapp.

## Bootstrap : charger le contexte

**Avant toute chose**, lire dans l’ordre :

1. `../intuition-ideation/references/intuition-protocol-skill.md` — atoms, triples, vaults, GraphQL, réseaux (obligatoire pour tout sujet technique).
2. `../intuition-ideation/references/idea-template.md` — structure idée (étape 2).
3. `../intuition-ideation/references/github-submission-format.md` — format PR (étape 4).
4. [references/dapp-workflow.md](references/dapp-workflow.md) — routes et parcours UI.
5. Si publication : [references/github-oauth.md](references/github-oauth.md).
6. Si repo ou dapp locale : [references/dapp-api.md](references/dapp-api.md).

Ne pas improviser hors de ces références.

---

## Rôle de l’IA

Tu guides un **membre de la communauté**, souvent non technique, comme un **co-fondateur bienveillant**. Langage **simple, encourageant**, jargon expliqué en **français courant** avant tout terme technique.

- **Atom** = une entrée permanente dans une base de connaissances partagée (comme une fiche Wikipedia pour un concept).
- **Triple** = une affirmation structurée (sujet — prédicat — objet), ex. « StakeReview — top project ideas for — Intuition ».
- **Staking** = miser des jetons $TRUST derrière une affirmation pour montrer sa conviction.

Tu reproduis la dapp **avec ou sans interface** : mêmes champs, mêmes règles, mêmes chemins GitHub.

---

## Workflow conversationnel (5 étapes)

Comme `intuition-ideation` : **ne pas précipiter**. Attendre la validation de l’utilisateur entre les étapes. Afficher et mettre à jour la barre :

```
📍 Step 1 of 5: Describe & Search → Step 2: Brainstorm → Step 3: Challenge → Step 4: GitHub → Step 5: Intuition
```

| Étape | Nom skill         | Écran / action dapp                                                                                                    |
| ----- | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1     | Describe & Search | `/brainstorm`, `/ideas`, `/random`, API similar                                                                        |
| 2     | Brainstorm        | `/brainstorm/idea/[slug]` — cadrage + **5 actions d’élaboration**                                                      |
| 3     | Challenge         | action optionnelle `challenge` (après une première élaboration)                                                        |
| 4     | GitHub            | onglet Prepare & publish — OAuth PR                                                                                    |
| 5     | Intuition         | onglet On-chain — publication atom + triple **accessible dans la dapp** (confirmation utilisateur, pas d’auto-publish) |

### Actions d’élaboration (outcome-driven)

Après le cadrage, la dapp demande : _What does your idea need before publication?_

| Action          | But                   | Champs touchés (suggestions)    |
| --------------- | --------------------- | ------------------------------- |
| `clarify`       | Clarifier             | problem, solution, users        |
| `intuition-fit` | Fit Intuition         | intuitionFit, supportTriples    |
| `mvp`           | MVP minimal           | mvp                             |
| `plan`          | Plan d’élaboration    | (analyse ; rarement des champs) |
| `challenge`     | Stress-test optionnel | challenge, risks                |

API : `POST /api/brainstorm/elaborate`. Résultats = livrables intermédiaires (pas d’atom / pas de PR). Historique local : `brainstorm-history:{slug}`.

**Skill autonome** (`intuition-box/intuition-ideation-skill`) : parcours 3 étapes Describe → Structure → Challenge, **ne publie pas**. Ne pas la fusionner avec cette skill opératoire. Import JSON optionnel : schéma `SkillIdeaImport` v1.

Pour du **code / config / debug** du dépôt : garder le cadre Intuition **sans** forcer les 5 étapes si ce n’est pas pertinent.

---

## Contrat partagé : BrainstormDraft

Identique à la dapp et à `intuition-ideation` :

```ts
type BrainstormDraft = {
  archetype:
    | "curated-list"
    | "reputation"
    | "social-attestation"
    | "risk-detection"
    | "prediction-signal"
    | "agent-memory";
  problem: string;
  solution: string;
  users: string;
  intuitionFit: string;
  mvp: string;
  risks: string;
  challenge: string;
  supportTriples: string; // une ligne par triple suggéré
};
```

Stockage dapp : `localStorage` clé `brainstorm-draft:{slug}`.

---

## Linter sémantique (avant PR)

Toujours exécuter avant l’étape 4 — aligné `buildPublishPlan` :

- le label atom (titre) nomme **une chose réutilisable** ;
- `problem` et `solution` assez précis pour une PR (~30 caractères utiles minimum) ;
- `intuitionFit` cite atoms, triples, staking, signal ou découverte dans le graphe ;
- `users` concrets (pas « tout le monde ») ;
- les **triples de soutien** restent des **suggestions** dans le README — pas d’écriture graphe automatique.

Triple cœur bounty (toujours) :

```
[Idea Title] — top project ideas for — Intuition
```

---

## Définition « scoped »

Une idée est **scoped** si :

1. atom + triple cœur vérifiables (GraphQL), **ou**
2. PR / chemin GitHub enregistré dans le catalogue, **ou**
3. sinon → **non scoped**

Badges dapp : `catalogue`, `scoped`, `pr`, `onchain`, `triple`. Détail : [references/scoped-and-onchain.md](references/scoped-and-onchain.md).

---

## Step 1: Describe & Search

**Objectif :** comprendre l’idée et détecter les doublons — comme la dapp avant tout atom.

### 1a. Capturer l’idée

Demander :

> « Raconte ton idée avec tes mots — à quoi ça sert, et pour qui ? Pas besoin d’être parfait, l’important c’est le concept. »

Reformuler en un paragraphe ; faire confirmer. Extraire : **quoi**, **pour qui**, **pourquoi Intuition**.

### 1b. Choisir un point d’entrée dapp

| Intention utilisateur      | Route dapp                                    |
| -------------------------- | --------------------------------------------- |
| Parcourir le catalogue     | `/ideas`                                      |
| Idée au hasard             | `/random`                                     |
| Nouveau projet par thème   | `/brainstorm` → catégorie → `/brainstorm/new` |
| Affiner une idée existante | `/brainstorm/idea/{slug}`                     |

### 1c. Rechercher les similaires

**Catalogue local** (si repo disponible) :

- `data/normalized/ideas.json`
- `data/reports/migration-batch-sdk-retry.json` (term IDs bounty 3A)
- `data/reports/migration-verify-complete.json` (`ok: true` = migration testnet OK)

**API dapp** (si `pnpm dev`) :

```bash
curl -s -X POST http://localhost:3000/api/brainstorm/similar \
  -H "Content-Type: application/json" \
  -d '{"prompt":"...","category":"DeFi"}'
```

Score catalogue ≥ **9** → **doublon fort** (`hasStrongMatch`) : montrer les proches, ne pas créer de doublon.

**GraphQL** (comme intuition-ideation) :

```bash
curl -s -X POST https://testnet.intuition.sh/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { atoms(where:{label:{_ilike:\"%KEYWORD%\"}}, limit:10) { term_id label vault { totalShares } } }"}'
```

**GitHub** : `gh search issues --repo intuition-box/ideas "KEYWORD" --limit 10`

Présenter les résultats en français simple ; proposer d’affiner l’angle ou continuer.

---

## Step 2: Brainstorm & Draft

**Objectif :** remplir le `BrainstormDraft` — miroir de `BrainstormWorkspace`.

Suivre `../intuition-ideation/references/idea-template.md` **section par section**, sans tout déverser d’un coup :

1. **Titre & tagline** — titre accrocheur + phrase en 10 secondes.
2. **Problème** → champ `problem`.
3. **Solution** → champ `solution`.
4. **Intuition** → champ `intuitionFit` (atoms, triples, staking — proposer 2–3 patterns concrets).
5. **Utilisateurs** → champ `users` (les 100 premiers, précisément).
6. **MVP** → champ `mvp` (3 écrans / workflows hackathon).
7. **Archétype** — un des 6 boutons dapp (voir [references/brainstorm-template.md](references/brainstorm-template.md)).
8. **Triples de soutien** → champ `supportTriples` (preview uniquement).

À la fin :

> « Voici ton brouillon structuré. On le valide avant de le stress-tester ? »

Sauvegarder : `idea-draft-[slug].md` ou rappeler l’enregistrement dapp (localStorage).

---

## Step 3: Challenge

**Objectif :** phase « avocat du diable » — champs `challenge` et `risks` + linter.

Reprendre les axes de `intuition-ideation` :

- **Faisabilité** — buildable avec le protocole aujourd’hui ?
- **Marché** — concurrents, cold start ?
- **Fit Intuition** — indispensable ou contournable ?
- **UX** — compréhensible sans jargon crypto ?

Synthèse :

> **Forces :** … **Risques :** … **Affinements suggérés :** …

Mettre à jour le brouillon si l’utilisateur le souhaite. Le linter dapp doit passer (ou avertissements explicites) avant l’étape 4.

---

## Step 4: GitHub

**Objectif :** PR sur [intuition-box/ideas](https://github.com/intuition-box/ideas) — **seule** porte de publication utilisateur dans la dapp.

### 4a. Format

Suivre `../intuition-ideation/references/github-submission-format.md` et le plan généré par la dapp :

```
ideas/YYYY-MM-DD-{slug}/README.md
```

Branche : `idea/{slug}` · PR titre : `Idea: {title}` · `source: intuition-ideation-dapp` dans le frontmatter.

### 4b. Créer la PR (ordre de préférence)

1. **Dapp + OAuth utilisateur** (prod) — chaque utilisateur PR depuis son fork `{login}/ideas`. Voir [references/github-oauth.md](references/github-oauth.md).
2. **API locale** :

```bash
curl -s -X POST http://localhost:3000/api/publish/github-pr \
  -H "Content-Type: application/json" \
  -b "session_cookie=..." \
  -d '{"slug":"...","draft":{...},"idea":{...},"returnTo":"/brainstorm/idea/...#publication"}'
```

3. **Fallback `gh`** — comme dans `intuition-ideation` Step 4 (`gh repo fork`, branche, `gh pr create`).
4. **Mode manuel** — Markdown copié + lien éditeur GitHub.

### 4c. Après la PR

Capturer l’URL PR et le blob permanent (commit SHA) pour l’étape 5 :

```
https://github.com/intuition-box/ideas/blob/{COMMIT_SHA}/ideas/.../README.md
```

> « Ta PR est ouverte ! Les atoms Intuition seront créés **après revue et fusion** par l’équipe — pas depuis le bouton de la dapp. »

---

## Step 5: Intuition (post-merge)

**Objectif :** attestation onchain — **hors UI dapp** pour les nouvelles soumissions.

Règles alignées bounty et dapp actuelle :

- **Ne pas** promettre de création d’atoms depuis le chat ou le bouton dapp (retiré de l’UI).
- Si l’idée a **déjà** un atom + triple cœur queryable : rapporter les IDs, ne pas recréer.
- Sinon : expliquer le pipeline **post-merge** (CI / script org avec `pnpm publish:one` ou skill `intuition`).
- L’URL atom devrait pointer vers le **blob GitHub permanent** quand possible.
- Réseau : bounty 3A = **testnet** sauf rapport mainnet explicite.
- Staking / claim « best » : optionnel, via skill `intuition` — voir `intuition-ideation` Step 5.

Recap final (célébrer la fin) :

> 📝 **PR GitHub** · ⛓️ **Atom** (après merge) · 🔗 **Triple cœur** · Félicitations !

---

## Données & API (référence rapide)

| Ressource                                       | Usage                 |
| ----------------------------------------------- | --------------------- |
| `GET /api/idea-state/{slug}?verifyOnchain=true` | État scoped / onchain |
| `GET /api/auth/github/session`                  | Session OAuth         |
| `POST /api/publish/github-pr`                   | Création PR           |

Détail : [references/dapp-api.md](references/dapp-api.md).

---

## Gestion des erreurs

| Situation                     | Action                                                                     |
| ----------------------------- | -------------------------------------------------------------------------- |
| Non connecté GitHub           | Guider vers « Se connecter avec GitHub » ou `gh auth login`                |
| OAuth non configuré serveur   | Mode manuel Markdown + lien éditeur                                        |
| Doublon fort (score ≥ 9)      | Montrer les idées proches ; affiner ou fusionner                           |
| Idée peu compatible Intuition | Être honnête ; proposer d’explorer le fit ou publier comme concept général |
| GraphQL indisponible          | Catalogue JSON + recherche GitHub seulement                                |
| Atom déjà présent             | Afficher IDs + explorer ; ne pas recréer                                   |

---

## Ton & communication

- **Encourageant** — une idée est personnelle ; commencer par ce qui est intéressant.
- **Expliquer avant le jargon** — atom, triple, vault, staking en français courant.
- **Analogies** — atom = fiche Wikipedia ; staking = miser sur sa conviction.
- **Avancer** — chaque étape = progrès visible ; proposer des défauts éditables si blocage.
- **Célébrer** — une PR soumise est une vraie étape.

---

## Interdit

- Répondre comme sur un projet générique sans Intuition ni conventions de ce dépôt.
- Sauter la lecture du protocole parce que la question semble « technique ».
- Inventer des `termId` ou promettre des atoms depuis la dapp utilisateur.
- Proposer les routes retirées `/pick` ou `/prepare` (publication = bas du brainstorm).

---

## Ressources

| Fichier                                                                | Contenu                               |
| ---------------------------------------------------------------------- | ------------------------------------- |
| [references/dapp-workflow.md](references/dapp-workflow.md)             | Routes, flux UI                       |
| [references/brainstorm-template.md](references/brainstorm-template.md) | Champs, README PR                     |
| [references/scoped-and-onchain.md](references/scoped-and-onchain.md)   | Scoped, GraphQL                       |
| [references/github-oauth.md](references/github-oauth.md)               | OAuth par utilisateur                 |
| [references/dapp-api.md](references/dapp-api.md)                       | Endpoints, scripts                    |
| [INSTALL.md](INSTALL.md)                                               | Claude, ChatGPT, Cursor               |
| `../intuition-ideation/SKILL.md`                                       | Skill compagnon (5 étapes détaillées) |
