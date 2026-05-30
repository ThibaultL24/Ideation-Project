# Vision mission - Intuition Ideation Dapp

## Verification rapide

Sources verifiees le 2026-05-30 :

- `intuition-box/intuition-ideation-skill` existe, est public, et decrit bien un workflow en 5 etapes : Describe & Search, Brainstorm & Draft, Challenge, Publish to GitHub, Publish on Intuition.
- `intuition-box/ideas` existe, est public, et demande bien que les idees soient soumises par pull request, avec une idee par dossier sous `ideas/YYYY-MM-DD-idea-slug/README.md`.
- La documentation Intuition confirme le modele Atoms / Triples / Signals : les atoms sont les identifiants ou noeuds, les triples sont les relations sujet-predicat-objet, et les signals representent la conviction via staking.
- La documentation recommande de chercher les atoms/triples existants avant creation afin d'eviter la fragmentation du graphe.
- La documentation GraphQL confirme les usages de recherche, pagination, filtres precis, et lecture du graphe. La documentation SDK confirme les fonctions de detection/creation d'entities existantes comme `findAtomIds`, `findTripleIds`, `calculateAtomId` et `calculateTripleId`.
- Le PDF local `Brainstorming UI pour l'Intuition Ideation Dapp.pdf` est coherent avec cette direction : il cadre l'UI comme un atelier de brouillon semantique publiable, pas comme un simple outil de brainstorming.

Points non verifies ou a traiter comme hypotheses :

- La page Notion des 300 idees n'est pas verifiable publiquement depuis cette session. Il faudra un export ou un acces explicite pour garantir le parsing source.
- Je n'ai pas verifie que les 300 idees existent deja onchain. Au contraire, le bounty 3A semble formuler cela comme le travail a accomplir.
- Les montants `$TBD` des sous-bounties ne sont pas des informations actionnables tant qu'ils ne sont pas confirmes ailleurs.
- Le diagramme Whimsical n'a pas ete inspecte ici ; il doit rester une source UX secondaire tant que son contenu n'est pas exporte ou accessible.

## Ma lecture de la mission

La mission n'est pas seulement de construire une dapp qui affiche une idee aleatoire. La vraie mission est de transformer l'ideation Intuition en pipeline verifiable : une idee part d'un texte ou d'une entree aleatoire, elle est comparee a l'existant, elle est amelioree, elle devient un brouillon semantique, puis elle est publiee a deux endroits complementaires : GitHub pour la discussion humaine et Intuition pour la structure onchain.

Le produit doit donc faire trois choses tres bien :

1. Reduire la fragmentation : avant de creer quoi que ce soit, l'app doit chercher les atoms, triples et idees GitHub proches.
2. Transformer l'idee en structure : le brainstorming doit aider a produire un atom d'idee propre et un triple coeur pret a publier.
3. Rendre la publication progressive : GitHub et onchain doivent etre lies, mais l'utilisateur doit comprendre ce qui part ou, pourquoi, et avec quel niveau d'engagement.

## Vision produit

Je construirais l'experience comme un workspace d'ideation semantique, organise autour de quatre zones.

### 1. Entree et tirage aleatoire

L'utilisateur peut soit choisir une idee aleatoire depuis la liste onchain, soit saisir sa propre idee. Dans les deux cas, la dapp cree une session de travail avec :

- idee brute ;
- source de l'idee ;
- categorie ou archetype suppose ;
- etat GitHub ;
- etat onchain ;
- brouillon semantique courant.

Le tirage aleatoire ne doit pas etre un gadget. Il doit etre le bouton qui relance l'exploration du graphe : prendre une idee, montrer ce qui existe deja, puis inviter l'utilisateur a l'ameliorer.

### 2. Rail d'etat existant

Avant le brainstorm, l'app montre :

- atoms exacts ou proches ;
- triples existants autour de l'idee ;
- idee deja scoper ou non dans GitHub ;
- signal existant, si disponible ;
- claims proches ou contestes.

Le message UX doit etre simple : cette idee est nouvelle, proche d'une autre, deja publiee, ou deja soutenue/contestee.

### 3. Canvas de brainstorming guide

Le canvas ne doit pas etre un grand champ texte. Il doit guider l'utilisateur a travers les patterns Intuition les plus naturels :

- curated list ;
- reputation system ;
- social attestations ;
- fraud or risk detection ;
- prediction or confidence market ;
- data/query layer for agents.

Pour chaque idee, le canvas doit produire un brouillon court : probleme, utilisateur cible, mecanisme Intuition, pourquoi le signal compte, risque principal, version MVP.

### 4. Assistant semantique

C'est le coeur du produit. L'assistant ne doit pas seulement reformuler le pitch ; il doit verifier la qualite semantique :

- l'atom d'idee represente-t-il une seule chose ?
- le nom est-il clair et reutilisable ?
- le predicat est-il stable et comprehensible ?
- existe-t-il un atom canonique a reutiliser ?
- le triple coeur est-il pret ?
- faut-il seulement suggerer des triples de soutien au lieu de les publier tout de suite ?

Le triple coeur du bounty doit rester explicite :

```text
[Idea] - [top project ideas for] - [Intuition]
```

Ma recommandation : publier automatiquement seulement l'atom d'idee et le triple coeur quand les checks passent. Les triples de soutien doivent rester en preview au debut, pour eviter de polluer le graphe avec des predicats improvises.

## Vision technique

### Bounty 3A - migration des 300 idees

Livrable attendu : un pipeline reproductible, pas seulement un script ponctuel.

Etapes proposees :

1. Ingestion depuis export Notion ou dataset local.
2. Normalisation des idees en JSON stable : title, tagline, category, source, slug, body, tags.
3. Verification de doublons GitHub et onchain.
4. Creation ou reuse des atoms d'idees.
5. Creation du predicat `[top project ideas for]` si absent, sinon reuse.
6. Creation ou reuse de l'atom `[Intuition]`.
7. Creation des triples `[Idea] - [top project ideas for] - [Intuition]`.
8. Verification GraphQL : chaque atom et chaque triple doit etre queryable.
9. Rapport final : created, reused, failed, skipped, tx hash, ids, GraphQL proof.

Definition of done : on peut relancer le pipeline en dry-run sans creer de doublons.

### Bounty 3B - dapp

MVP recommande :

- liste onchain des idees ;
- bouton random idea ;
- recherche d'etat existant GitHub + GraphQL ;
- canvas de refinement ;
- preview Markdown pour `intuition-box/ideas` ;
- preview atom/triple ;
- publication GitHub PR ;
- publication onchain via wallet.

Je separerais clairement trois couches :

- `read layer` : GraphQL + GitHub reads ;
- `draft layer` : session locale, LLM/collaboration, validation semantique ;
- `write layer` : GitHub PR + SDK/protocol write.

### Bounty 3C - skill enhancement

La skill doit devenir le compagnon conversationnel de la dapp, pas un produit separe.

Ameliorations prioritaires :

- mode `random idea picker` depuis les atoms/triples onchain ;
- preflight GitHub + onchain avant brainstorm ;
- sortie structuree compatible avec la dapp ;
- meilleure etape 5 : creation atom/triple plus guidee, avec liens permanents GitHub ;
- langage non technique conserve, mais decisions protocole plus strictes.

## Architecture de donnees proposee

```ts
type IdeationSession = {
  source: 'random-onchain' | 'user-input' | 'github' | 'notion-import'
  rawInput: string
  selectedIdea?: {
    atomId?: string
    title: string
    githubPath?: string
    sourceId?: string
  }
  existingState: {
    githubMatches: Array<{ title: string; path: string; status?: string }>
    exactAtoms: Array<{ id: string; label: string }>
    relatedTriples: Array<{ id: string; subject: string; predicate: string; object: string }>
    signal?: { marketCap?: string; positionCount?: number }
  }
  draft: {
    title: string
    tagline: string
    problem: string
    targetUsers: string
    intuitionMechanism: string
    mvp: string
    risks: string[]
  }
  semanticPlan: {
    ideaAtomLabel: string
    coreTriple: [string, string, string]
    supportTriplesPreview: Array<[string, string, string]>
    onchainReady: boolean
    githubReady: boolean
  }
}
```

## Ordre de bataille recommande

1. Stabiliser la source des 300 idees et le schema JSON canonique.
2. Finaliser le script dry-run de verification GitHub + GraphQL.
3. Migrer un petit lot pilote de 5 a 10 idees onchain.
4. Construire la dapp autour du flux random idea -> existing state -> semantic draft -> preview.
5. Brancher GitHub PR creation.
6. Brancher publication onchain.
7. Ameliorer la skill pour consommer le meme schema et les memes checks.

## Risques principaux

- Fragmentation du graphe si les atoms/predicats sont crees trop librement.
- UX trop crypto si la creation onchain et le staking sont melanges trop tot.
- Source Notion fragile si aucun export stable n'est fourni.
- Dapp trop ambitieuse si collaboration temps reel, LLM et onchain writes arrivent avant le preflight d'existence.
- Publication GitHub et publication onchain non liees par un identifiant permanent.

## Decision produit cle

Le MVP doit prouver une boucle simple et native Intuition :

```text
random idea -> check existing state -> refine -> create GitHub PR -> create/reuse atom -> create/reuse triple -> verify queryability
```

Tout le reste est utile, mais secondaire. La qualite de cette boucle vaut plus qu'une interface de brainstorming spectaculaire.