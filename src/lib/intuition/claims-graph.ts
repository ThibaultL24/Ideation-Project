// src/lib/intuition/claims-graph.ts
import { execGraphql } from "./graphql";
import { getNetworkConfig, IDEA_PREDICATE_LABEL } from "./config";
export const IDEA_PREDICATE_TERM_ID =
  "0xc3e6f1bb243fa82208dbfb2b5b73cf11a1ad26b04e59fd275b163e244c7825b5" as const;

export const IDEA_OBJECT_TERM_ID =
  "0xda797f4aa19c2b129bd3a33cdb8d260b94672fcdb295d04e2533dc02a994a3d8" as const;

export const TESTNET_PORTAL_URL = "https://testnet.portal.intuition.systems";
export const TESTNET_PORTAL_EXPLORER_URL = `${TESTNET_PORTAL_URL}/explore/home`;
export const TESTNET_GRAPHQL_CONSOLE_URL = "https://testnet.intuition.sh/console";

export interface IdeaClaimRow {
  termId: string;
  subjectLabel: string;
  subjectTermId: string;
  predicateLabel: string;
  objectLabel: string;
  objectTermId: string;
}

const IDEA_CLAIMS_QUERY = `
query IdeaClaims($predicateId: String!, $limit: Int!, $offset: Int!) {
  triples_aggregate(where: { predicate_id: { _eq: $predicateId } }) {
    aggregate { count }
  }
  triples(
    where: { predicate_id: { _eq: $predicateId } }
    limit: $limit
    offset: $offset
    order_by: { subject: { label: asc } }
  ) {
    term_id
    subject { label term_id }
    predicate { label }
    object { label term_id }
  }
}`;

interface IdeaClaimsResult {
  triples: Array<{
    term_id: string;
    subject: { label: string; term_id: string };
    predicate: { label: string };
    object: { label: string; term_id: string };
  }>;
  triples_aggregate: { aggregate?: { count?: number | string | null } | null };
}

export async function fetchIdeaClaims(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ total: number; claims: IdeaClaimRow[] }> {
  const config = getNetworkConfig("testnet");
  const limit = params?.limit ?? 500;
  const offset = params?.offset ?? 0;

  const data = await execGraphql<IdeaClaimsResult>(
    config.graphql,
    IDEA_CLAIMS_QUERY,
    { predicateId: IDEA_PREDICATE_TERM_ID, limit, offset },
  );

  const total = Number(data.triples_aggregate?.aggregate?.count ?? 0);
  const claims = (data.triples ?? []).map((row) => ({
    termId: row.term_id,
    subjectLabel: row.subject.label,
    subjectTermId: row.subject.term_id,
    predicateLabel: row.predicate.label,
    objectLabel: row.object.label,
    objectTermId: row.object.term_id,
  }));

  return { total, claims };
}

export function portalExplorerUrl(): string {
  return TESTNET_PORTAL_EXPLORER_URL;
}

export const CLAIM_PATTERN = {
  predicateLabel: IDEA_PREDICATE_LABEL,
  pattern: "projet → top project ideas for → Intuition Protocol",
} as const;
