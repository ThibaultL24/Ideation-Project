// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ideation — Project ideas on Intuition",
  description:
    "Discover and explore project ideas attested on the Intuition knowledge graph.",
};

const PORTAL_EXPLORER_URL =
  "https://testnet.portal.intuition.systems/explore/home";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <header className="border-b border-[var(--border)] bg-[var(--card)]">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4 text-sm">
            <a href="/" className="font-semibold text-[var(--accent)]">
              Ideation
            </a>
            <a href="/ideas" className="text-[var(--muted)] hover:text-white">
              Catalogue
            </a>
            <a
              href={PORTAL_EXPLORER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--muted)] hover:text-white"
            >
              Explorer
            </a>
            <a href="/random" className="text-[var(--muted)] hover:text-white">
              Découvrir
            </a>
            <a href="/workshop" className="text-[var(--muted)] hover:text-white">
              Atelier
            </a>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
