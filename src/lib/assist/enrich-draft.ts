// src/lib/assist/enrich-draft.ts
import type { GraphInspectResult } from "@/lib/intuition/graph-inspect";
import type { TripleDraft, TripleLine } from "@/lib/workshop/triple-draft";

export interface TripleOnchainBinding {
  subjectTermId?: string;
  predicateTermId?: string;
  objectTermId?: string;
  tripleTermId?: string;
  subjectStatus: "exists" | "new" | "unknown";
  predicateStatus: "exists" | "new" | "unknown";
  objectStatus: "exists" | "new" | "unknown";
  network?: string;
}

export interface EnrichedTripleLine extends TripleLine {
  onchain?: TripleOnchainBinding;
}

export interface EnrichedTripleDraft extends Omit<TripleDraft, "coreTriple" | "supportTriples" | "nestedTriples"> {
  coreTriple: EnrichedTripleLine;
  supportTriples: EnrichedTripleLine[];
  nestedTriples: EnrichedTripleLine[];
  graphSummary?: string[];
}

function findAtomByLabel(
  inspect: GraphInspectResult,
  label: string,
  network: "testnet" | "mainnet" = "testnet",
): { term_id: string; label: string } | undefined {
  const net = inspect.networks.find((n) => n.network === network);
  if (!net) return undefined;
  const normalized = label.trim().toLowerCase();
  const hit = net.similarAtoms.find(
    (a) => a.label.trim().toLowerCase() === normalized,
  );
  return hit ? { term_id: hit.term_id, label: hit.label } : undefined;
}

function bindLine(
  line: TripleLine,
  inspect: GraphInspectResult,
  coreTripleTermId?: string,
): EnrichedTripleLine {
  const net = inspect.networks.find((n) => n.network === "testnet");
  const subject = findAtomByLabel(inspect, line.subject);
  const predicate = findAtomByLabel(inspect, line.predicate);
  const object = findAtomByLabel(inspect, line.object);

  return {
    ...line,
    onchain: {
      subjectTermId: subject?.term_id ?? net?.catalogAtom?.term_id,
      predicateTermId: predicate?.term_id ?? net?.bountyPredicate?.term_id,
      objectTermId: object?.term_id ?? net?.intuitionObject?.term_id,
      tripleTermId:
        line.kind === "core" ? net?.coreTriple.predictedTermId ?? coreTripleTermId : undefined,
      subjectStatus: subject || net?.catalogAtom ? "exists" : "new",
      predicateStatus: predicate || net?.bountyPredicate ? "exists" : "unknown",
      objectStatus: object || net?.intuitionObject ? "exists" : "unknown",
      network: "testnet",
    },
  };
}

export function enrichTripleDraft(
  draft: TripleDraft,
  inspect: GraphInspectResult,
): EnrichedTripleDraft {
  const testnet = inspect.networks.find((n) => n.network === "testnet");
  const graphSummary: string[] = [];

  if (testnet?.coreTriple.exists) {
    graphSummary.push("Core triple already exists on testnet — do not recreate it.");
  }
  if (testnet?.subjectTriples.length) {
    graphSummary.push(
      `${testnet.subjectTriples.length} existing triple(s) for a similar subject — mirror real predicates.`,
    );
  }
  if (testnet?.popularPredicates.length) {
    graphSummary.push(
      `Popular predicates: ${testnet.popularPredicates.slice(0, 5).map((p) => p.label).join(", ")}.`,
    );
  }

  return {
    ...draft,
    coreTriple: bindLine(draft.coreTriple, inspect, testnet?.coreTriple.predictedTermId),
    supportTriples: draft.supportTriples.map((t) => bindLine(t, inspect)),
    nestedTriples: draft.nestedTriples.map((t) => bindLine(t, inspect)),
    graphSummary,
  };
}
