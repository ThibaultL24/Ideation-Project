// src/app/loading.tsx
export default function RootLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
        aria-hidden
      />
      <p className="text-sm text-[var(--muted)]">Loading Hunch…</p>
    </div>
  );
}
