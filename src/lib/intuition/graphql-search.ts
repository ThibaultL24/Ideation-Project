// src/lib/intuition/graphql-search.ts
import type { IntuitionNetworkConfig } from "./config";
import { execGraphql } from "./graphql";

export interface AtomSearchRow {
  term_id: string;
  label: string;
  type: string;
  vault?: {
    totalShares?: string | number | null;
    positionCount?: number | string | null;
  } | null;
  as_predicate_triples_aggregate?: {
    aggregate?: { count?: number | string | null } | null;
  } | null;
  as_subject_triples_aggregate?: {
    aggregate?: { count?: number | string | null } | null;
  } | null;
}

export interface TripleRow {
  term_id: string;
  subject_id: string;
  predicate_id: string;
  object_id: string;
  counter_term_id?: string | null;
  vault?: {
    totalShares?: string | number | null;
    positionCount?: number | string | null;
  } | null;
}

const SEARCH_ATOMS_ILIKE = `
query SearchAtomsIlike($pattern: String!, $limit: Int!) {
  atoms(
    where: { label: { _ilike: $pattern } }
    limit: $limit
    order_by: { created_at: desc }
  ) {
    term_id
    label
    type
    vault {
      totalShares
      positionCount
    }
    as_predicate_triples_aggregate {
      aggregate { count }
    }
    as_subject_triples_aggregate {
      aggregate { count }
    }
  }
}`;

const TRIPLES_AS_SUBJECT = `
query TriplesAsSubject($subjectId: String!, $limit: Int!) {
  triples(
    where: { subject_id: { _eq: $subjectId } }
    limit: $limit
    order_by: { created_at: desc }
  ) {
    term_id
    subject_id
    predicate_id
    object_id
    counter_term_id
    vault {
      totalShares
      positionCount
    }
  }
}`;

const ATOMS_BY_TERM_IDS = `
query AtomsByTermIds($termIds: [String!]!) {
  atoms(where: { term_id: { _in: $termIds } }, limit: 50) {
    term_id
    label
    type
  }
}`;

const PREDICATE_ATOMS_BY_USAGE = `
query PredicateAtomsByUsage($limit: Int!) {
  atoms(
    where: {
      as_predicate_triples_aggregate: { count: { predicate: { _gt: 0 } } }
      type: { _neq: "TextObject" }
    }
    limit: $limit
    order_by: { as_predicate_triples_aggregate: { count: desc } }
  ) {
    term_id
    label
    type
    as_predicate_triples_aggregate {
      aggregate { count }
    }
  }
}`;

export async function searchAtomsByLabelPattern(
  config: IntuitionNetworkConfig,
  pattern: string,
  limit = 12,
): Promise<AtomSearchRow[]> {
  type Out = { atoms: AtomSearchRow[] };
  const data = await execGraphql<Out>(config.graphql, SEARCH_ATOMS_ILIKE, {
    pattern: `%${pattern}%`,
    limit,
  });
  return data.atoms ?? [];
}

export async function fetchTriplesAsSubject(
  config: IntuitionNetworkConfig,
  subjectTermId: string,
  limit = 12,
): Promise<TripleRow[]> {
  type Out = { triples: TripleRow[] };
  const data = await execGraphql<Out>(config.graphql, TRIPLES_AS_SUBJECT, {
    subjectId: subjectTermId,
    limit,
  });
  return data.triples ?? [];
}

export async function resolveAtomLabels(
  config: IntuitionNetworkConfig,
  termIds: string[],
): Promise<Map<string, { label: string; type: string }>> {
  const unique = [...new Set(termIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  type Out = { atoms: Array<{ term_id: string; label: string; type: string }> };
  const data = await execGraphql<Out>(config.graphql, ATOMS_BY_TERM_IDS, {
    termIds: unique.slice(0, 50),
  });

  const map = new Map<string, { label: string; type: string }>();
  for (const row of data.atoms ?? []) {
    map.set(row.term_id, { label: row.label, type: row.type });
  }
  return map;
}

export async function fetchPopularPredicates(
  config: IntuitionNetworkConfig,
  limit = 15,
): Promise<AtomSearchRow[]> {
  try {
    type Out = { atoms: AtomSearchRow[] };
    const data = await execGraphql<Out>(
      config.graphql,
      PREDICATE_ATOMS_BY_USAGE,
      { limit },
    );
    return data.atoms ?? [];
  } catch {
    return [];
  }
}

export interface ResolvedTriple {
  term_id: string;
  subject: string;
  predicate: string;
  object: string;
  subject_id: string;
  predicate_id: string;
  object_id: string;
  totalShares?: string | number | null;
  positionCount?: number | string | null;
}

export async function fetchResolvedTriplesAsSubject(
  config: IntuitionNetworkConfig,
  subjectTermId: string,
  limit = 12,
): Promise<ResolvedTriple[]> {
  const rows = await fetchTriplesAsSubject(config, subjectTermId, limit);
  const ids = rows.flatMap((r) => [r.predicate_id, r.object_id]);
  const labels = await resolveAtomLabels(config, ids);

  return rows.map((row) => ({
    term_id: row.term_id,
    subject_id: row.subject_id,
    predicate_id: row.predicate_id,
    object_id: row.object_id,
    subject: labels.get(row.subject_id)?.label ?? row.subject_id.slice(0, 10) + "…",
    predicate: labels.get(row.predicate_id)?.label ?? "…",
    object: labels.get(row.object_id)?.label ?? "…",
    totalShares: row.vault?.totalShares,
    positionCount: row.vault?.positionCount,
  }));
}
