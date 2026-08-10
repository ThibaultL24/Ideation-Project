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
      className="neon-tabs flex flex-wrap gap-1 rounded-xl p-1"
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
                ? "neon-tab-active"
                : "text-[var(--muted)] hover:text-[var(--cyan-bright)]"
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
