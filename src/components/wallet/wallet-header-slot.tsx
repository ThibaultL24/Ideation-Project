"use client";

// src/components/wallet/wallet-header-slot.tsx
import dynamic from "next/dynamic";

const HeaderWallet = dynamic(
  () =>
    import("@/components/wallet/header-wallet").then((module) => module.HeaderWallet),
  {
    ssr: false,
    loading: () => (
      <div className="ml-auto h-8 w-28 animate-pulse rounded-full border border-[var(--border)] bg-[var(--card)]" />
    ),
  },
);

export function WalletHeaderSlot() {
  return (
    <div className="ml-auto flex items-center">
      <HeaderWallet />
    </div>
  );
}
