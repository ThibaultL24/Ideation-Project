// src/app/layout.tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { HunchGlyph } from "@/components/brand/hunch-logo";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hunch — Every idea starts as a hunch",
  description:
    "Turn a raw hunch into a structured idea: AI brainstorm, challenge, GitHub PR and onchain attestation on the Intuition knowledge graph.",
};

const PORTAL_EXPLORER_URL =
  "https://testnet.portal.intuition.systems/explore/home";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen antialiased">
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
            <a href="/pick" className="text-[var(--muted)] hover:text-white">
              Cards
            </a>
            <a href="/brainstorm" className="text-[var(--muted)] hover:text-white">
              Brainstorm
            </a>
            <a href="/prepare" className="text-[var(--muted)] hover:text-white">
              Prepare
            </a>
            <a href="/random" className="text-[var(--muted)] hover:text-white">
              Random
            </a>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
