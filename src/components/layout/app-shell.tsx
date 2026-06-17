// src/components/layout/app-shell.tsx
import { HunchGlyph } from "@/components/brand/hunch-logo";
import { WalletHeaderSlot } from "@/components/wallet/wallet-header-slot";

const PORTAL_EXPLORER_URL =
  "https://testnet.portal.intuition.systems/explore/home";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[oklch(0.145_0_0_/_0.65)] backdrop-blur-xl">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4 text-sm md:gap-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 font-semibold tracking-tight text-[var(--foreground)]"
          >
            <HunchGlyph size={22} />
            Hunch
            <span className="text-[10px] font-normal uppercase tracking-widest text-[var(--accent)]">
              Intuition
            </span>
          </a>
          <a href="/ideas" className="text-[var(--muted)] hover:text-white">
            Catalog
          </a>
          <a
            href={PORTAL_EXPLORER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--muted)] hover:text-white"
          >
            Explorer
          </a>
          <a href="/brainstorm" className="text-[var(--muted)] hover:text-white">
            Brainstorm
          </a>
          <a href="/random" className="text-[var(--muted)] hover:text-white">
            Random
          </a>
          <WalletHeaderSlot />
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </>
  );
}
