"use client";

// src/components/brainstorm/publish-tab-nav.tsx

interface PublishTabNavProps<T extends string> {
  tabs: ReadonlyArray<{ id: T; label: string }>;
  active: T;
  onChange: (id: T) => void;
}

export function PublishTabNav<T extends string>({
  tabs,
  active,
  onChange,
}: PublishTabNavProps<T>) {
  return (
    <nav
      className="flex flex-wrap gap-1 rounded-xl border border-[var(--border)] bg-[var(--background)] p-1"
      aria-label="Publication sections"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm ring-1 ring-[var(--border)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
