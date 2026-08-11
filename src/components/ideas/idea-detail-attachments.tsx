// src/components/ideas/idea-detail-attachments.tsx
interface IdeaDetailAttachmentsProps {
  prUrl?: string;
  blobUrl?: string;
}

export function IdeaDetailAttachments({
  prUrl,
  blobUrl,
}: IdeaDetailAttachmentsProps) {
  const githubUrl = prUrl || blobUrl;
  if (!githubUrl) return null;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm">
      <h2 className="font-semibold">GitHub PR</h2>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {prUrl ? "Pull request linked to this idea." : "GitHub file link."}
      </p>
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-[var(--accent)] hover:underline"
      >
        {prUrl ? "View PR →" : "View on GitHub →"}
      </a>
    </section>
  );
}
