"use client";

// src/components/wallet/wallet-panel-slot.tsx
import dynamic from "next/dynamic";
import { walletStrings } from "@/lib/strings/wallet";

const IntuitionWalletPanel = dynamic(
  () =>
    import("@/components/wallet/intuition-wallet-panel").then(
      (module) => module.IntuitionWalletPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="text-sm text-[var(--muted)]">{walletStrings.panelLoading}</p>
      </div>
    ),
  },
);

export function WalletPanelSlot() {
  return <IntuitionWalletPanel />;
}
