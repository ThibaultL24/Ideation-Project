// src/app/api/verify/atom-name/route.ts
import { NextResponse } from "next/server";
import {
  deriveProjectNameFromIntent,
  normalizeProjectName,
  verifyAtomByProjectName,
} from "@/lib/ideas/verify-atom-by-name";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name =
    searchParams.get("name")?.trim() ||
    searchParams.get("projectName")?.trim() ||
    searchParams.get("title")?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Query param name, projectName or title is required." },
      { status: 400 },
    );
  }

  try {
    const verification = await verifyAtomByProjectName({ projectName: name });
    return NextResponse.json(verification);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  let body: {
    name?: string;
    projectName?: string;
    title?: string;
    intent?: string;
    headline?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const projectName = normalizeProjectName(
    body.name?.trim() ||
      body.projectName?.trim() ||
      body.title?.trim() ||
      deriveProjectNameFromIntent(body.intent ?? "", body.headline) ||
      "",
  );

  if (projectName.length < 2) {
    return NextResponse.json(
      { error: "Project name must be at least 2 characters." },
      { status: 400 },
    );
  }

  try {
    const verification = await verifyAtomByProjectName({ projectName });
    return NextResponse.json(verification);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 502 },
    );
  }
}
