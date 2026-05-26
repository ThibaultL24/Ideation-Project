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
