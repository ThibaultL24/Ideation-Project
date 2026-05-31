// src/app/api/workshop/prepare/onchain/route.ts
import { NextResponse } from "next/server";

/** Publication on-chain désactivée — l'atelier ne crée que des PR GitHub. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Publication on-chain désactivée dans l'atelier. Utilise « Créer la PR sur GitHub » à la place.",
    },
    { status: 410 },
  );
}
