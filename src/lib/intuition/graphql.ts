// src/lib/intuition/graphql.ts
import type { IntuitionNetworkConfig } from "./config";

export interface PinThingInput {
  name: string;
  description: string;
  image?: string;
  url?: string;
}

const PIN_THING_MUTATION = `
mutation pinThing($name: String!, $description: String!, $image: String!, $url: String!) {
  pinThing(thing: { name: $name, description: $description, image: $image, url: $url }) {
    uri
  }
}`;

const FIND_ATOMS_BY_LABEL = `
query FindAtomsByLabel($label: String!, $limit: Int!) {
  atoms(where: { label: { _eq: $label } }, limit: $limit) {
    term_id
    label
    type
    as_predicate_triples_aggregate {
      aggregate { count }
    }
  }
}`;

const FIND_ATOMS_BY_LABEL_ILIKE = `
query FindAtomsByLabelIlike($pattern: String!, $limit: Int!) {
  atoms(where: { label: { _ilike: $pattern } }, limit: $limit, order_by: { created_at: desc }) {
    term_id
    label
    type
    vault {
      totalShares
      positionCount
    }
  }
}`;

const FIND_ATOM_BY_TERM_ID = `
query FindAtomByTermId($termId: String!) {
  atoms(where: { term_id: { _eq: $termId } }, limit: 1) {
    term_id
    label
    type
    data
  }
}`;

interface GraphqlEnvelope<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function execGraphql<T>(
  graphqlUrl: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = process.env["INTUITION_GRAPHQL_BEARER_TOKEN"]?.trim();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json = (await response.json()) as GraphqlEnvelope<T>;
  if (!response.ok) {
    throw new Error(`GraphQL HTTP ${response.status}`);
  }
  if (json.errors?.length && (!json.data || Object.keys(json.data).length === 0)) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data as T;
}

export async function pinThing(
  config: IntuitionNetworkConfig,
  input: PinThingInput,
): Promise<string> {
  type Out = { pinThing?: { uri?: string | null } | null };
  const data = await execGraphql<Out>(config.graphql, PIN_THING_MUTATION, {
    name: input.name,
    description: input.description,
    image: input.image ?? "",
    url: input.url ?? "",
  });
  const uri = data.pinThing?.uri?.trim();
  if (!uri?.startsWith("ipfs://")) {
    throw new Error("pinThing returned no valid ipfs:// URI");
  }
  return uri;
}

export interface AtomRow {
  term_id: string;
  label: string;
  type: string;
  as_predicate_triples_aggregate?: {
    aggregate?: { count?: number | string | null } | null;
  } | null;
}

export async function findAtomsByLabel(
  config: IntuitionNetworkConfig,
  label: string,
  limit = 20,
): Promise<AtomRow[]> {
  type Out = { atoms: AtomRow[] };
  const data = await execGraphql<Out>(config.graphql, FIND_ATOMS_BY_LABEL, {
    label,
    limit,
  });
  return data.atoms ?? [];
}

export interface AtomSearchRow {
  term_id: string;
  label: string;
  type: string;
  vault?: {
    totalShares?: string | number | null;
    positionCount?: number | string | null;
  } | null;
}

export async function findAtomsByLabelIlike(
  config: IntuitionNetworkConfig,
  term: string,
  limit = 20,
): Promise<AtomSearchRow[]> {
  type Out = { atoms: AtomSearchRow[] };
  const pattern = `%${term.replace(/%/g, "")}%`;
  const data = await execGraphql<Out>(config.graphql, FIND_ATOMS_BY_LABEL_ILIKE, {
    pattern,
    limit,
  });
  return data.atoms ?? [];
}

export function pickCanonicalAtom(rows: AtomRow[]): AtomRow | undefined {
  const nonText = rows.filter((row) => row.type !== "TextObject");
  const sorted = [...(nonText.length > 0 ? nonText : rows)].sort((a, b) => {
    const ca = Number(a.as_predicate_triples_aggregate?.aggregate?.count ?? 0);
    const cb = Number(b.as_predicate_triples_aggregate?.aggregate?.count ?? 0);
    return cb - ca;
  });
  return sorted[0];
}

export async function verifyAtomQueryable(
  config: IntuitionNetworkConfig,
  termId: string,
): Promise<boolean> {
  type Out = { atoms: Array<{ term_id: string }> };
  const data = await execGraphql<Out>(config.graphql, FIND_ATOM_BY_TERM_ID, {
    termId,
  });
  return (data.atoms?.length ?? 0) > 0;
}

const ATOMS_AGGREGATE_BY_TERM_IDS = `
query AtomsAggregateByTermIds($termIds: [String!]!) {
  atoms_aggregate(where: { term_id: { _in: $termIds } }) {
    aggregate { count }
  }
}`;

const ATOMS_BY_TERM_IDS = `
query AtomsByTermIds($termIds: [String!]!, $limit: Int!) {
  atoms(where: { term_id: { _in: $termIds } }, limit: $limit) {
    term_id
    label
  }
}`;

const TRIPLES_AGGREGATE_BY_SUBJECTS = `
query TriplesAggregateBySubjects(
  $subjectIds: [String!]!
  $predicateId: String!
  $objectId: String!
) {
  triples_aggregate(
    where: {
      subject_id: { _in: $subjectIds }
      predicate_id: { _eq: $predicateId }
      object_id: { _eq: $objectId }
    }
  ) {
    aggregate { count }
  }
}`;

const TRIPLES_BY_SUBJECTS = `
query TriplesBySubjects(
  $subjectIds: [String!]!
  $predicateId: String!
  $objectId: String!
  $limit: Int!
) {
  triples(
    where: {
      subject_id: { _in: $subjectIds }
      predicate_id: { _eq: $predicateId }
      object_id: { _eq: $objectId }
    }
    limit: $limit
  ) {
    term_id
    subject_id
  }
}`;

const FIND_TRIPLE_BY_TERM_ID = `
query FindTripleByTermId($termId: String!) {
  triples(where: { term_id: { _eq: $termId } }, limit: 1) {
    term_id
    subject_id
    predicate_id
    object_id
  }
}`;

export async function verifyTripleQueryable(
  config: IntuitionNetworkConfig,
  tripleTermId: string,
): Promise<boolean> {
  type Out = { triples: Array<{ term_id: string }> };
  const data = await execGraphql<Out>(config.graphql, FIND_TRIPLE_BY_TERM_ID, {
    termId: tripleTermId,
  });
  return (data.triples?.length ?? 0) > 0;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Compte les atoms indexés pour une liste de term_id (requête aggregate, sans limite de pagination). */
export async function countAtomsInGraphql(
  config: IntuitionNetworkConfig,
  termIds: string[],
): Promise<number> {
  type Out = { atoms_aggregate: { aggregate?: { count?: number | null } | null } };
  const data = await execGraphql<Out>(
    config.graphql,
    ATOMS_AGGREGATE_BY_TERM_IDS,
    { termIds },
  );
  return Number(data.atoms_aggregate?.aggregate?.count ?? 0);
}

/** Retourne les term_id d'atoms trouvés via GraphQL (par chunks pour contourner la limite de pagination). */
export async function findAtomTermIdsInGraphql(
  config: IntuitionNetworkConfig,
  termIds: string[],
  chunkSize = 100,
): Promise<Set<string>> {
  const found = new Set<string>();
  for (const batch of chunk(termIds, chunkSize)) {
    type Out = { atoms: Array<{ term_id: string }> };
    const data = await execGraphql<Out>(config.graphql, ATOMS_BY_TERM_IDS, {
      termIds: batch,
      limit: batch.length,
    });
    for (const row of data.atoms ?? []) {
      found.add(row.term_id);
    }
  }
  return found;
}

/** Compte les triples [subject → predicate → object] indexés pour une liste de subjects. */
export async function countTriplesInGraphql(
  config: IntuitionNetworkConfig,
  subjectIds: string[],
  predicateId: string,
  objectId: string,
): Promise<number> {
  type Out = { triples_aggregate: { aggregate?: { count?: number | null } | null } };
  const data = await execGraphql<Out>(
    config.graphql,
    TRIPLES_AGGREGATE_BY_SUBJECTS,
    { subjectIds, predicateId, objectId },
  );
  return Number(data.triples_aggregate?.aggregate?.count ?? 0);
}

/** Retourne les subject_id de triples trouvés via GraphQL. */
export async function findTripleSubjectsInGraphql(
  config: IntuitionNetworkConfig,
  subjectIds: string[],
  predicateId: string,
  objectId: string,
  chunkSize = 100,
): Promise<Set<string>> {
  const found = new Set<string>();
  for (const batch of chunk(subjectIds, chunkSize)) {
    type Out = { triples: Array<{ subject_id: string }> };
    const data = await execGraphql<Out>(config.graphql, TRIPLES_BY_SUBJECTS, {
      subjectIds: batch,
      predicateId,
      objectId,
      limit: batch.length,
    });
    for (const row of data.triples ?? []) {
      found.add(row.subject_id);
    }
  }
  return found;
}
