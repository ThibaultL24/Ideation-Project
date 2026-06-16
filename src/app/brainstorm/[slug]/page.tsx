// src/app/brainstorm/[slug]/page.tsx — redirection vers /brainstorm/idea/[slug]
import { redirect } from "next/navigation";

interface LegacyBrainstormPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LegacyBrainstormPage({
  params,
}: LegacyBrainstormPageProps) {
  const { slug } = await params;
  redirect(`/brainstorm/idea/${slug}`);
}
