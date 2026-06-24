// src/lib/intuition/catalog-graph.ts
import {
  BOUNTY_PREDICATE_LABEL,
  getNetworkConfig,
  MAINNET_INTUITION_PROTOCOL_TERM_ID,
  type IntuitionNetwork,
  type IntuitionNetworkConfig,
} from "./config";
import { execGraphql, findAtomsByLabel, pickCanonicalAtom } from "./graphql";

const CATALOG_PAGE_SIZE = 100;

const CATALOG_TRIPLES_PAGE = `
query CatalogTriplesPage(
  $predicateId: String!
  $objectId: String!
  $limit: Int!
  $offset: Int!
) {
  triples(
    where: {
      predicate_id: { _eq: $predicateId }
      object_id: { _eq: $objectId }
    }
    limit: $limit
    offset: $offset
    order_by: { subject: { label: asc } }
  ) {
    term_id
    subject_id
    subject {
      term_id
      label
      type
      data
    }
  }
}`;

export interface CatalogGraphSubject {
  atomTermId: string;
  tripleTermId: string;
  label: string;
  type: string;
  ipfsUri: string | null;
}

export interface CatalogGraphSlice {
  network: IntuitionNetwork;
  predicateId: string;
  objectId: string;
  subjects: CatalogGraphSubject[];
}

export async function resolveCatalogAnchorIds(
  config: IntuitionNetworkConfig,
): Promise<{ predicateId: string; objectId: string }> {
  const predicateRows = await findAtomsByLabel(config, BOUNTY_PREDICATE_LABEL, 10);
  const predicate = pickCanonicalAtom(predicateRows);
  if (!predicate?.term_id) {
    throw new Error(`Catalog predicate not found: ${BOUNTY_PREDICATE_LABEL}`);
  }

  if (config.network === "mainnet") {
    return {
      predicateId: predicate.term_id,
      objectId: MAINNET_INTUITION_PROTOCOL_TERM_ID,
    };
  }

  const objectRows = await findAtomsByLabel(config, "Intuition Protocol", 10);
  const object = pickCanonicalAtom(objectRows);
  if (!object?.term_id) {
    throw new Error('Catalog object not found: "Intuition Protocol"');
  }

  return { predicateId: predicate.term_id, objectId: object.term_id };
}

export async function fetchCatalogGraphSlice(
  network?: IntuitionNetwork,
): Promise<CatalogGraphSlice | null> {
  const config = getNetworkConfig(network);

  let predicateId: string;
  let objectId: string;
  try {
    ({ predicateId, objectId } = await resolveCatalogAnchorIds(config));
  } catch {
    return null;
  }

  const subjects: CatalogGraphSubject[] = [];
  let offset = 0;

  for (;;) {
    type Out = {
      triples: Array<{
        term_id: string;
        subject_id: string;
        subject?: {
          term_id: string;
          label: string;
          type: string;
          data?: string | null;
        } | null;
      }>;
    };

    const data = await execGraphql<Out>(config.graphql, CATALOG_TRIPLES_PAGE, {
      predicateId,
      objectId,
      limit: CATALOG_PAGE_SIZE,
      offset,
    });

    const page = data.triples ?? [];
    if (page.length === 0) break;

    for (const row of page) {
      const subject = row.subject;
      if (!subject?.term_id || !subject.label) continue;
      const ipfs = subject.data?.trim();
      subjects.push({
        atomTermId: subject.term_id,
        tripleTermId: row.term_id,
        label: subject.label,
        type: subject.type,
        ipfsUri: ipfs?.startsWith("ipfs://") ? ipfs : null,
      });
    }

    if (page.length < CATALOG_PAGE_SIZE) break;
    offset += CATALOG_PAGE_SIZE;
  }

  if (subjects.length === 0) return null;

  return {
    network: config.network,
    predicateId,
    objectId,
    subjects,
  };
}
