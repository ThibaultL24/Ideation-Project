// src/lib/ideas/verify-atom-by-name.ts
import {
  BOUNTY_PREDICATE_LABEL,
  getNetworkConfig,
  MAINNET_INTUITION_PROTOCOL_TERM_ID,
  type IntuitionNetwork,
  type IntuitionNetworkConfig,
} from "@/lib/intuition/config";
import {
  countTriplesInGraphql,
  findAtomsByLabel,
  findAtomsByLabelIlike,
  pickCanonicalAtom,
  type AtomRow,
} from "@/lib/intuition/graphql";

export interface AtomNameMatch {
  termId: string;
  label: string;
  type: string;
  exact: boolean;
  coreTriplePresent: boolean;
}

export interface AtomNameVerification {
  projectName: string;
  network: IntuitionNetwork;
  exactMatch: boolean;
  matches: AtomNameMatch[];
  canonicalAtomId: string | null;
  coreTriplePresent: boolean;
  canPublishNewAtom: boolean;
  message: string;
}

export function normalizeProjectName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function isExactProjectNameMatch(a: string, b: string): boolean {
  return (
    normalizeProjectName(a).toLowerCase() === normalizeProjectName(b).toLowerCase()
  );
}

export function deriveProjectNameFromIntent(
  intent: string,
  headline?: string | null,
): string {
  const fromHeadline = headline?.trim();
  if (fromHeadline) return fromHeadline.slice(0, 80);

  const firstSentence =
    intent.trim().split(/[.!?\n]/)[0]?.trim() ?? intent.trim();
  return (firstSentence || intent.trim()).slice(0, 80);
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

async function coreTriplePresentForAtom(
  config: IntuitionNetworkConfig,
  atomId: string,
): Promise<boolean> {
  const predicateId = await resolvePredicateTermIdReadonly(config);
  const objectId = await resolveObjectTermIdReadonly(config);
  if (!predicateId || !objectId) return false;

  const count = await countTriplesInGraphql(
    config,
    [atomId],
    predicateId,
    objectId,
  );
  return count > 0;
}

function rowToMatch(
  row: AtomRow,
  projectName: string,
  coreTriplePresent: boolean,
): AtomNameMatch {
  return {
    termId: row.term_id,
    label: row.label,
    type: row.type,
    exact: isExactProjectNameMatch(row.label, projectName),
    coreTriplePresent,
  };
}

export async function verifyAtomByProjectName(params: {
  projectName: string;
  network?: IntuitionNetwork;
}): Promise<AtomNameVerification> {
  const projectName = normalizeProjectName(params.projectName);
  const config = getNetworkConfig(params.network);

  if (projectName.length < 2) {
    return {
      projectName,
      network: config.network,
      exactMatch: false,
      matches: [],
      canonicalAtomId: null,
      coreTriplePresent: false,
      canPublishNewAtom: false,
      message: "Project name too short for on-chain verification.",
    };
  }

  const exactRows = await findAtomsByLabel(config, projectName, 15);
  const exactFiltered = exactRows.filter((row) =>
    isExactProjectNameMatch(row.label, projectName),
  );

  let similarRows: AtomRow[] = [];
  if (exactFiltered.length === 0) {
    similarRows = await findAtomsByLabelIlike(
      config,
      `%${projectName.slice(0, 40)}%`,
      8,
    );
  }

  const candidateRows = exactFiltered.length > 0 ? exactFiltered : similarRows;
  const canonical = pickCanonicalAtom(candidateRows);

  const matches: AtomNameMatch[] = [];
  for (const row of candidateRows.slice(0, 8)) {
    const triplePresent = await coreTriplePresentForAtom(config, row.term_id);
    matches.push(rowToMatch(row, projectName, triplePresent));
  }

  const canonicalMatch = canonical
    ? matches.find((m) => m.termId === canonical.term_id)
    : undefined;
  const exactMatch = exactFiltered.length > 0;
  const coreTriplePresent = Boolean(canonicalMatch?.coreTriplePresent);

  if (exactMatch && canonical) {
    return {
      projectName,
      network: config.network,
      exactMatch: true,
      matches,
      canonicalAtomId: canonical.term_id,
      coreTriplePresent,
      canPublishNewAtom: false,
      message: coreTriplePresent
        ? `An atom « ${canonical.label} » already exists with the core triple on ${config.network}.`
        : `An atom « ${canonical.label} » already exists on ${config.network} (core triple missing).`,
    };
  }

  if (matches.length > 0) {
    return {
      projectName,
      network: config.network,
      exactMatch: false,
      matches,
      canonicalAtomId: canonical?.term_id ?? null,
      coreTriplePresent: false,
      canPublishNewAtom: true,
      message: `No exact atom « ${projectName} » — ${matches.length} similar name(s) found.`,
    };
  }

  return {
    projectName,
    network: config.network,
    exactMatch: false,
    matches: [],
    canonicalAtomId: null,
    coreTriplePresent: false,
    canPublishNewAtom: true,
    message: `No atom found for « ${projectName} » on ${config.network}.`,
  };
}

export async function resolveAtomIdByProjectName(
  projectName: string,
  network?: IntuitionNetwork,
): Promise<string | null> {
  const result = await verifyAtomByProjectName({ projectName, network });
  if (result.exactMatch && result.canonicalAtomId) {
    return result.canonicalAtomId;
  }
  return null;
}
