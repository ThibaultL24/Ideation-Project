// src/lib/intuition/graph-inspect.ts
import { calculateTripleId } from "@0xintuition/sdk";
import {
  BOUNTY_PREDICATE_LABEL,
  getNetworkConfig,
  type IntuitionNetwork,
} from "./config";
import { findAtomsByLabel, pickCanonicalAtom, verifyTripleQueryable } from "./graphql";
import {
  fetchPopularPredicates,
  fetchResolvedTriplesAsSubject,
  searchAtomsByLabelPattern,
  type AtomSearchRow,
  type ResolvedTriple,
} from "./graphql-search";
import { getMigrationAtomTermId } from "./migration-atoms";

export interface InspectAtom {
  term_id: string;
  label: string;
  type: string;
  predicateUsage: number;
  subjectUsage: number;
  totalShares?: string | number | null;
  positionCount?: number | string | null;
}

export interface NetworkGraphInspect {
  network: IntuitionNetwork;
  graphqlUrl: string;
  explorerUrl: string;
  similarAtoms: InspectAtom[];
  catalogAtom?: InspectAtom & { fromMigration: boolean };
  bountyPredicate?: InspectAtom;
  intuitionObject?: InspectAtom;
  coreTriple: {
    exists: boolean;
    predictedTermId?: string;
    subjectLabel: string;
  };
  subjectTriples: ResolvedTriple[];
  popularPredicates: Array<{ label: string; term_id: string; usage: number }>;
  errors: string[];
}

export interface GraphInspectResult {
  searchTerms: string[];
  networks: NetworkGraphInspect[];
}

function toInspectAtom(row: AtomSearchRow): InspectAtom {
  return {
    term_id: row.term_id,
    label: row.label,
    type: row.type,
    predicateUsage: Number(
      row.as_predicate_triples_aggregate?.aggregate?.count ?? 0,
    ),
    subjectUsage: Number(
      row.as_subject_triples_aggregate?.aggregate?.count ?? 0,
    ),
    totalShares: row.vault?.totalShares,
    positionCount: row.vault?.positionCount,
  };
}

function extractSearchTerms(rawIntent: string, ideaTitle: string): string[] {
  const stop = new Set([
    "avec", "pour", "dans", "une", "des", "les", "the", "and", "that", "this",
    "intuition", "idée", "idea", "app", "dapp",
  ]);
  const tokens = `${ideaTitle} ${rawIntent}`
    .toLowerCase()
    .split(/[^a-z0-9àâäéèêëïîôùûüç]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4 && !stop.has(t));
  return [...new Set(tokens)].slice(0, 5);
}

async function inspectNetwork(
  network: IntuitionNetwork,
  input: {
    rawIntent: string;
    ideaTitle: string;
    canonicalId?: string;
  },
): Promise<NetworkGraphInspect> {
  const config = getNetworkConfig(network);
  const errors: string[] = [];
  const searchTerms = extractSearchTerms(input.rawIntent, input.ideaTitle);

  const similarMap = new Map<string, InspectAtom>();

  for (const term of [input.ideaTitle, ...searchTerms]) {
    try {
      const rows = await searchAtomsByLabelPattern(config, term, 8);
      for (const row of rows) {
        if (!similarMap.has(row.term_id)) {
          similarMap.set(row.term_id, toInspectAtom(row));
        }
      }
    } catch (e) {
      errors.push(`search:${term}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  let catalogAtom: (InspectAtom & { fromMigration: boolean }) | undefined;
  if (input.canonicalId) {
    const termId = getMigrationAtomTermId(input.canonicalId);
    if (termId) {
      try {
        const exact = await findAtomsByLabel(config, input.ideaTitle, 3);
        const hit = exact.find((a) => a.term_id === termId) ?? exact[0];
        if (hit) {
          catalogAtom = { ...toInspectAtom(hit as AtomSearchRow), fromMigration: true };
          similarMap.set(hit.term_id, catalogAtom);
        } else {
          catalogAtom = {
            term_id: termId,
            label: input.ideaTitle,
            type: "Thing",
            predicateUsage: 0,
            subjectUsage: 0,
            fromMigration: true,
          };
          similarMap.set(termId, catalogAtom);
        }
      } catch {
        catalogAtom = {
          term_id: termId,
          label: input.ideaTitle,
          type: "Thing",
          predicateUsage: 0,
          subjectUsage: 0,
          fromMigration: true,
        };
      }
    }
  }

  let bountyPredicate: InspectAtom | undefined;
  let intuitionObject: InspectAtom | undefined;
  let coreTripleExists = false;
  let predictedTermId: string | undefined;

  try {
    const predRows = await findAtomsByLabel(config, BOUNTY_PREDICATE_LABEL, 5);
    const pred = pickCanonicalAtom(predRows);
    if (pred) bountyPredicate = toInspectAtom(pred as AtomSearchRow);

    const objRows = await findAtomsByLabel(config, "Intuition", 5);
    const obj = pickCanonicalAtom(objRows);
    if (obj) intuitionObject = toInspectAtom(obj as AtomSearchRow);

    const subjectRows = await findAtomsByLabel(config, input.ideaTitle, 8);
    const subject = catalogAtom ?? pickCanonicalAtom(subjectRows);
    if (subject && pred && obj) {
      predictedTermId = calculateTripleId(
        subject.term_id as `0x${string}`,
        pred.term_id as `0x${string}`,
        obj.term_id as `0x${string}`,
      );
      coreTripleExists = await verifyTripleQueryable(config, predictedTermId);
    }
  } catch (e) {
    errors.push(`core: ${e instanceof Error ? e.message : "error"}`);
  }

  let subjectTriples: ResolvedTriple[] = [];
  let subjectId = catalogAtom?.term_id;
  if (!subjectId) {
    try {
      const subjectRows = await findAtomsByLabel(config, input.ideaTitle, 8);
      subjectId = pickCanonicalAtom(subjectRows)?.term_id;
    } catch {
      subjectId = undefined;
    }
  }

  if (subjectId) {
    try {
      subjectTriples = await fetchResolvedTriplesAsSubject(config, subjectId, 10);
    } catch (e) {
      errors.push(`triples: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  let popularPredicates: NetworkGraphInspect["popularPredicates"] = [];
  try {
    const preds = await fetchPopularPredicates(config, 12);
    popularPredicates = preds.map((p) => ({
      label: p.label,
      term_id: p.term_id,
      usage: Number(p.as_predicate_triples_aggregate?.aggregate?.count ?? 0),
    }));
  } catch {
  }

  return {
    network,
    graphqlUrl: config.graphql,
    explorerUrl: config.explorer,
    similarAtoms: [...similarMap.values()].slice(0, 20),
    catalogAtom,
    bountyPredicate,
    intuitionObject,
    coreTriple: {
      exists: coreTripleExists,
      predictedTermId,
      subjectLabel: input.ideaTitle,
    },
    subjectTriples,
    popularPredicates,
    errors,
  };
}

export async function buildGraphInspect(input: {
  rawIntent: string;
  ideaTitle: string;
  canonicalId?: string;
  networks?: IntuitionNetwork[];
}): Promise<GraphInspectResult> {
  const networks = input.networks ?? ["testnet", "mainnet"];
  const searchTerms = extractSearchTerms(input.rawIntent, input.ideaTitle);
  const results: NetworkGraphInspect[] = [];

  for (const network of networks) {
    results.push(
      await inspectNetwork(network, {
        rawIntent: input.rawIntent,
        ideaTitle: input.ideaTitle,
        canonicalId: input.canonicalId,
      }),
    );
  }

  return { searchTerms, networks: results };
}

export function graphInspectForPrompt(result: GraphInspectResult): object {
  return {
    searchTerms: result.searchTerms,
    networks: result.networks.map((n) => ({
      network: n.network,
      similarAtoms: n.similarAtoms.slice(0, 8).map((a) => ({
        label: a.label,
        term_id: a.term_id,
        type: a.type,
        predicateUsage: a.predicateUsage,
        shares: a.totalShares,
      })),
      catalogAtom: n.catalogAtom
        ? { label: n.catalogAtom.label, term_id: n.catalogAtom.term_id, migration: n.catalogAtom.fromMigration }
        : null,
      coreTriple: n.coreTriple,
      existingSubjectTriples: n.subjectTriples.slice(0, 8).map((t) => ({
        labels: `${t.subject} → ${t.predicate} → ${t.object}`,
        term_id: t.term_id,
        shares: t.totalShares,
      })),
      popularPredicates: n.popularPredicates.slice(0, 10),
      bountyPredicate: n.bountyPredicate?.label,
      intuitionObject: n.intuitionObject?.label,
    })),
  };
}
