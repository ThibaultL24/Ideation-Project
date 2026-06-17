// src/app/layout.tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppShell } from "@/components/layout/app-shell";
import { Web3Provider } from "@/components/providers/web3-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hunch — Every idea starts as a hunch",
  description:
    "Turn a raw hunch into a structured idea: AI brainstorm, challenge, GitHub PR and onchain attestation on the Intuition knowledge graph.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen antialiased">
        <Web3Provider>
          <AppShell>{children}</AppShell>
        </Web3Provider>
      </body>
    </html>
  );
}
