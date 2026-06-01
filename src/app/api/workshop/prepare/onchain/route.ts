// src/app/api/workshop/prepare/onchain/route.ts
import { NextResponse } from "next/server";

/** On-chain publishing disabled — workshop opens GitHub PRs only. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "On-chain publishing is disabled in the workshop. Use « Create GitHub PR » on Prepare instead.",
    },
    { status: 410 },
  );
}
