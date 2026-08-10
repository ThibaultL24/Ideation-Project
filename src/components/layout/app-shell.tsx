// src/components/layout/app-shell.tsx
import Link from "next/link";
import { HunchGlyph } from "@/components/brand/hunch-logo";
import { WalletHeaderSlot } from "@/components/wallet/wallet-header-slot";
import { getExplorerUrl } from "@/lib/intuition/config";

const EXPLORER_URL = getExplorerUrl();

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/85 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4 text-sm md:gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold tracking-tight text-[var(--foreground)]"
          >
            <HunchGlyph size={22} />
            Hunch
            <span className="neon-kicker text-[10px] font-normal uppercase">
              Intuition
            </span>
          </Link>
          <Link
            href="/ideas"
            className="text-[var(--muted)] transition hover:text-[var(--cyan-bright)]"
          >
            Catalog
          </Link>
          <a
            href={EXPLORER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--muted)] transition hover:text-[var(--cyan-bright)]"
          >
            Explorer
          </a>
          <Link
            href="/brainstorm"
            className="text-[var(--muted)] transition hover:text-[var(--cyan-bright)]"
          >
            Brainstorm
          </Link>
          <Link
            href="/random"
            className="text-[var(--muted)] transition hover:text-[var(--cyan-bright)]"
          >
            Random
          </Link>
          <WalletHeaderSlot />
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </>
  );
}
