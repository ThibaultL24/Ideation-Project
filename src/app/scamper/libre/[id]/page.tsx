// src/app/scamper/libre/[id]/page.tsx
import { ScamperLibreLoader } from "@/components/scamper/scamper-libre-loader";

interface ScamperLibreSessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScamperLibreSessionPage({
  params,
}: ScamperLibreSessionPageProps) {
  const { id } = await params;
  return <ScamperLibreLoader id={id} />;
}
