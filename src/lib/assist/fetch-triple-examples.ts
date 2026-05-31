// src/lib/assist/fetch-triple-examples.ts
import { BOUNTY_PREDICATE_LABEL } from "@/lib/intuition/config";
import { getNetworkConfig } from "@/lib/intuition/config";
import type { GraphInspectResult } from "@/lib/intuition/graph-inspect";
import { fetchResolvedTriplesAsSubject } from "@/lib/intuition/graphql-search";

export interface EcosystemTripleExample {
  ideaLabel: string;
  subject: string;
  predicate: string;
  object: string;
  shares?: string | number | null;
}

function isBountyTriple(predicate: string, object: string): boolean {
  return (
    predicate.toLowerCase() === BOUNTY_PREDICATE_LABEL.toLowerCase() &&
    /intuition/i.test(object)
  );
}

export async function fetchEcosystemTripleExamples(
  inspect: GraphInspectResult,
  maxIdeas = 4,
  maxPerIdea = 4,
): Promise<EcosystemTripleExample[]> {
  const testnet = inspect.networks.find((n) => n.network === "testnet");
  if (!testnet) return [];

  const config = getNetworkConfig("testnet");
  const subjectCandidates = [
    ...(testnet.catalogAtom ? [testnet.catalogAtom] : []),
    ...testnet.similarAtoms.filter((a) => a.subjectUsage > 0 || a.predicateUsage === 0),
  ];

  const seenSubjects = new Set<string>();
  const examples: EcosystemTripleExample[] = [];

  for (const atom of subjectCandidates) {
    if (seenSubjects.has(atom.term_id)) continue;
    seenSubjects.add(atom.term_id);
    if (examples.length >= maxIdeas * maxPerIdea) break;

    try {
      const triples = await fetchResolvedTriplesAsSubject(config, atom.term_id, maxPerIdea + 2);
      for (const t of triples) {
        if (isBountyTriple(t.predicate, t.object)) continue;
        if (t.predicate.length < 2 || t.object.length > 60) continue;
        examples.push({
          ideaLabel: atom.label,
          subject: t.subject,
          predicate: t.predicate,
          object: t.object,
          shares: t.totalShares,
        });
        if (examples.filter((e) => e.ideaLabel === atom.label).length >= maxPerIdea) break;
      }
    } catch {
      // skip atom
    }
    if (new Set(examples.map((e) => e.ideaLabel)).size >= maxIdeas) break;
  }

  return examples.slice(0, maxIdeas * maxPerIdea);
}
