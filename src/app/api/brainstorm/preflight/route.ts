// src/app/api/brainstorm/preflight/route.ts
import { NextResponse } from "next/server";
import {
  findAtomsByLabel,
  pickCanonicalAtom,
  verifyTripleQueryable,
} from "@/lib/intuition/graphql";
import { getNetworkConfig, IDEA_PREDICATE_LABEL } from "@/lib/intuition/config";
import { calculateTripleId } from "@0xintuition/sdk";

interface PreflightBody {
  subject?: string;
  predicate?: string;
  object?: string;
}

export async function POST(request: Request) {
  let body: PreflightBody;
  try {
    body = (await request.json()) as PreflightBody;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const subject = body.subject?.trim() ?? "";
  const predicate = body.predicate?.trim() ?? IDEA_PREDICATE_LABEL;
  const object = body.object?.trim() ?? "Intuition";

  if (!subject) {
    return NextResponse.json({ error: "Sujet requis" }, { status: 400 });
  }

  const config = getNetworkConfig();

  try {
    const [subjectRows, predicateRows, objectRows] = await Promise.all([
      findAtomsByLabel(config, subject, 5),
      findAtomsByLabel(config, predicate, 5),
      findAtomsByLabel(config, object, 5),
    ]);

    const subjectAtom = pickCanonicalAtom(subjectRows);
    const predicateAtom = pickCanonicalAtom(predicateRows);
    const objectAtom = pickCanonicalAtom(objectRows);

    let tripleExists = false;
    let predictedTripleId: string | null = null;

    if (subjectAtom && predicateAtom && objectAtom) {
      try {
        predictedTripleId = calculateTripleId(
          subjectAtom.term_id as `0x${string}`,
          predicateAtom.term_id as `0x${string}`,
          objectAtom.term_id as `0x${string}`,
        );
        tripleExists = await verifyTripleQueryable(config, predictedTripleId);
      } catch {
        /* offline calc may fail without full setup */
      }
    }

    return NextResponse.json({
      subjectExists: Boolean(subjectAtom),
      predicateExists: Boolean(predicateAtom),
      objectExists: Boolean(objectAtom),
      tripleExists,
      predictedTripleId,
      canonical: {
        subject: subjectAtom?.term_id ?? null,
        predicate: predicateAtom?.term_id ?? null,
        object: objectAtom?.term_id ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur preflight";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
