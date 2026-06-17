// src/lib/ideas/idea-state.ts
import type { Idea, IdeaStatus } from "./schema";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  BOUNTY_PREDICATE_LABEL,
  getNetworkConfig,
  MAINNET_INTUITION_PROTOCOL_TERM_ID,
  type IntuitionNetworkConfig,
} from "@/lib/intuition/config";
import {
  countTriplesInGraphql,
  findAtomsByLabel,
  pickCanonicalAtom,
  verifyAtomQueryable,
} from "@/lib/intuition/graphql";
import { resolveAtomIdByProjectName } from "./verify-atom-by-name";

const SCOPED_STATUSES = new Set<IdeaStatus>([
  "github_ready",
  "github_published",
  "ipfs_pinned",
  "atom_created",
  "triples_created",
  "verified",
  "published",
  "onchain",
]);

interface MigrationAtomRow {
  canonicalId: string;
  termId: string;
  ipfsUri?: string;
}

let reportAtomCache: Map<string, string> | null = null;

function loadReportedAtomIds(): Map<string, string> {
  if (reportAtomCache) return reportAtomCache;
  const map = new Map<string, string>();
  const retryPath = path.join(
    process.cwd(),
    "data/reports/migration-batch-sdk-retry.json",
  );
  if (existsSync(retryPath)) {
    try {
      const report = JSON.parse(readFileSync(retryPath, "utf8")) as {
        ideaAtomIds?: MigrationAtomRow[];
      };
      for (const row of report.ideaAtomIds ?? []) {
        map.set(row.canonicalId, row.termId);
      }
    } catch {
      /* ignore malformed optional report */
    }
  }
  reportAtomCache = map;
  return map;
}

export function getReportedAtomId(idea: Idea): string | null {
  return idea.intuition?.atomId?.trim() || loadReportedAtomIds().get(idea.canonicalId) || null;
}

export interface IdeaDbState {
  scoped: boolean;
  hasGithubPath: boolean;
  hasGithubPr: boolean;
  status: IdeaStatus;
}

export interface IdeaOnchainState {
  atomId: string | null;
  atomInIndexer: boolean;
  coreTriplePresent: boolean;
  network: string;
}

export type IdeaNextAction =
  | "view_ready"
  | "prepare_onchain"
  | "brainstorm"
  | "create_with_prompt"
  | "sync_db";

export interface IdeaFullState {
  slug: string;
  canonicalId: string;
  title: string;
  category: string;
  tagline: string;
  db: IdeaDbState;
  onchain: IdeaOnchainState | null;
  nextAction: IdeaNextAction;
  badges: string[];
}

export function getIdeaDbState(idea: Idea): IdeaDbState {
  const hasGithubPath = Boolean(idea.github?.path);
  const hasGithubPr = Boolean(idea.github?.prUrl);
  const scoped =
    SCOPED_STATUSES.has(idea.status) || hasGithubPath || hasGithubPr;

  return {
    scoped,
    hasGithubPath,
    hasGithubPr,
    status: idea.status,
  };
}

async function resolveObjectTermIdReadonly(
  config: IntuitionNetworkConfig,
): Promise<string | null> {
  if (config.network === "mainnet") {
    return MAINNET_INTUITION_PROTOCOL_TERM_ID;
  }
  const rows = await findAtomsByLabel(config, "Intuition Protocol", 10);
  return pickCanonicalAtom(rows)?.term_id ?? null;
}

async function resolvePredicateTermIdReadonly(
  config: IntuitionNetworkConfig,
): Promise<string | null> {
  const rows = await findAtomsByLabel(config, BOUNTY_PREDICATE_LABEL, 10);
  return pickCanonicalAtom(rows)?.term_id ?? null;
}

export async function verifyIdeaOnchain(
  idea: Idea,
): Promise<IdeaOnchainState> {
  const config = getNetworkConfig();
  let atomId = getReportedAtomId(idea);

  if (!atomId && idea.title.trim()) {
    atomId = await resolveAtomIdByProjectName(idea.title, config.network);
  }

  let atomInIndexer = false;
  if (atomId) {
    atomInIndexer = await verifyAtomQueryable(config, atomId);
  }

  let coreTriplePresent = false;
  if (atomId && atomInIndexer) {
    const predicateId = await resolvePredicateTermIdReadonly(config);
    const objectId = await resolveObjectTermIdReadonly(config);
    if (predicateId && objectId) {
      const count = await countTriplesInGraphql(
        config,
        [atomId],
        predicateId,
        objectId,
      );
      coreTriplePresent = count > 0;
    }
  }

  return {
    atomId,
    atomInIndexer,
    coreTriplePresent,
    network: config.network,
  };
}

export function resolveNextAction(
  db: IdeaDbState,
  onchain: IdeaOnchainState | null,
): IdeaNextAction {
  const hasAtom = Boolean(onchain?.atomInIndexer);
  const hasTriple = Boolean(onchain?.coreTriplePresent);

  if (db.hasGithubPr && hasAtom && hasTriple) return "view_ready";
  if (db.hasGithubPr) return "prepare_onchain";
  if (hasAtom && !db.hasGithubPr) return "sync_db";
  if (db.scoped && !db.hasGithubPr) return "brainstorm";
  return "create_with_prompt";
}

export function buildBadges(
  db: IdeaDbState,
  onchain: IdeaOnchainState | null,
): string[] {
  const badges: string[] = ["catalog"];
  if (db.scoped) badges.push("scoped");
  if (db.hasGithubPr) badges.push("pr");
  if (onchain?.atomInIndexer) badges.push("onchain");
  if (onchain?.coreTriplePresent) badges.push("triple");
  if (!db.scoped && !onchain?.atomInIndexer && !db.hasGithubPr) {
    badges.push("needs_work");
  }
  return badges;
}

export async function buildIdeaFullState(
  idea: Idea,
  options?: { verifyOnchain?: boolean },
): Promise<IdeaFullState> {
  const db = getIdeaDbState(idea);
  let onchain: IdeaOnchainState | null = null;

  if (options?.verifyOnchain) {
    try {
      onchain = await verifyIdeaOnchain(idea);
    } catch {
      onchain = {
        atomId: getReportedAtomId(idea),
        atomInIndexer: false,
        coreTriplePresent: false,
        network: getNetworkConfig().network,
      };
    }
  }

  const nextAction = resolveNextAction(db, onchain);

  return {
    slug: idea.slug,
    canonicalId: idea.canonicalId,
    title: idea.title,
    category: idea.category,
    tagline: idea.tagline,
    db,
    onchain,
    nextAction,
    badges: buildBadges(db, onchain),
  };
}

export function buildScopePrompt(idea: Idea): string {
  return `You are helping scope an Intuition ecosystem product idea.

Catalog idea: ${idea.title}
Category: ${idea.category}
Tagline: ${idea.tagline}
Description: ${idea.description}

Produce:
1. Problem statement (who hurts, how often)
2. Proposed solution (user journey in 3 steps)
3. Target users (first 100 users, specific)
4. Why Intuition (atoms, triples, staking — which features are essential)
5. Core triple suggestion: [Subject] — [predicate] — [Object]
6. MVP in 3 screens
7. GitHub deliverable outline for intuition-box/ideas
8. Main risks and a hackathon-sized version`;
}

export function pickRandomIdeas<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    const [item] = pool.splice(index, 1);
    if (item !== undefined) picked.push(item);
  }
  return picked;
}
