"use client";

// src/components/wallet/header-wallet.tsx
import { IntuitionConnectButton } from "@/components/wallet/intuition-connect-button";

export function HeaderWallet() {
  return (
    <div className="ml-auto flex items-center">
      <IntuitionConnectButton variant="navbar" />
    </div>
  );
}
