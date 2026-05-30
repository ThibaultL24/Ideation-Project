// src/app/brainstorm/libre/[id]/page.tsx
import { BrainstormLibreLoader } from "@/components/brainstorm/brainstorm-libre-loader";

interface BrainstormLibrePageProps {
  params: Promise<{ id: string }>;
}

export default async function BrainstormLibrePage({
  params,
}: BrainstormLibrePageProps) {
  const { id } = await params;
  return <BrainstormLibreLoader id={id} />;
}
