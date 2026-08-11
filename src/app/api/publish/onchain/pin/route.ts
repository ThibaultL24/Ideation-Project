// src/app/api/publish/onchain/pin/route.ts
import { NextResponse } from "next/server";
import type { PinThingMutationVariables } from "@0xintuition/graphql";
import type { BrainstormDraft } from "@/lib/ideas/publish-plan";
import { resolvePublishIdea } from "@/lib/ideas/resolve-publish-idea";
import { ideaToPinThing, labelToPinThing } from "@/lib/intuition/idea-thing";
import { getNetworkConfig } from "@/lib/intuition/config";
import {
  pinThingForNetwork,
  resolvePinBackend,
} from "@/lib/intuition/pin-thing";

export async function POST(request: Request) {
  const backend = resolvePinBackend();
  if (!backend) {
    return NextResponse.json(
      {
        error:
          "No IPFS pin credential — set INTUITION_PIN_API_KEY or PINATA_JWT in Coolify (server secrets).",
      },
      { status: 503 },
    );
  }

  let body: {
    thing?: PinThingMutationVariables;
    slug?: string;
    idea?: unknown;
    draft?: Partial<BrainstormDraft>;
    githubBlobUrl?: string;
    label?: { name?: string; description?: string };
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let thing: PinThingMutationVariables | null = null;

  if (body.thing?.name) {
    thing = {
      name: body.thing.name,
      description: body.thing.description ?? "",
      image: body.thing.image ?? "",
      url: body.thing.url ?? "",
    };
  } else if (body.label?.name) {
    thing = labelToPinThing(
      body.label.name,
      body.label.description ?? body.label.name,
    );
  } else {
    const idea = resolvePublishIdea(body);
    if (idea) {
      thing = ideaToPinThing(idea, body.githubBlobUrl, body.draft);
    }
  }

  if (!thing) {
    return NextResponse.json(
      { error: "Provide thing, label, or idea/slug to pin." },
      { status: 400 },
    );
  }

  try {
    const uri = await pinThingForNetwork(getNetworkConfig(), thing);
    return NextResponse.json({ uri, backend });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
