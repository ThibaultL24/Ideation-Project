"use client";

// src/components/wallet/intuition-connect-button.tsx
import { useEffect, useRef, useState } from "react";
import { useDisconnect } from "wagmi";
import { IntuitionConnectModal } from "@/components/wallet/intuition-connect-modal";
import { IntuitionWalletAvatar } from "@/components/wallet/intuition-wallet-avatar";
import { useIntuitionWallet } from "@/hooks/use-intuition-wallet";
import { formatTokenBalance } from "@/lib/web3/format-balance";
import { formatWalletAddress } from "@/lib/web3/format-wallet-address";
import { INTUITION_NETWORK_HUB_URL } from "@/lib/web3/intuition-network";
import { walletStrings } from "@/lib/strings/wallet";

interface IntuitionConnectButtonProps {
  variant?: "navbar" | "panel";
  className?: string;
}

export function IntuitionConnectButton({
  variant = "navbar",
  className = "",
}: IntuitionConnectButtonProps) {
  const [connectOpen, setConnectOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const {
    targetChain,
    networkLabel,
    address,
    isConnected,
    isOnTargetChain,
    balance,
    balanceSymbol,
    isBalanceLoading,
    isSwitching,
    switchToTargetChain,
  } = useIntuitionWallet();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (shellRef.current && !shellRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  const shellClass = variant === "navbar" ? "relative shrink-0" : `relative ${className}`;

  if (isConnected && address) {
    const short = formatWalletAddress(address);
    const triggerClass =
      variant === "navbar"
        ? "intuition-wallet-trigger intuition-wallet-trigger--navbar"
        : "intuition-wallet-trigger intuition-wallet-trigger--panel";

    return (
      <div className={shellClass} ref={shellRef}>
        <button
          type="button"
          className={triggerClass}
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <IntuitionWalletAvatar address={address} size={variant === "navbar" ? 24 : 28} />
          <span>{!isOnTargetChain ? walletStrings.switchNetwork : short}</span>
          <span className="text-[10px] opacity-50" aria-hidden>
            ▾
          </span>
        </button>
        {menuOpen ? (
          <div className="intuition-wallet-menu" role="menu">
            <div className="intuition-wallet-menu__header">
              <IntuitionWalletAvatar address={address} size={36} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{short}</p>
                <p className="intuition-wallet-menu__address">{address}</p>
              </div>
            </div>
            <div className="intuition-wallet-menu__meta">
              <p>{networkLabel}</p>
              {!isBalanceLoading && balance != null ? (
                <p className="intuition-wallet-menu__balance mt-1">
                  {formatTokenBalance(balance.value, balance.decimals)} {balanceSymbol}
                </p>
              ) : null}
            </div>
            <div className="intuition-wallet-menu__actions">
              {!isOnTargetChain ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={isSwitching}
                  className="intuition-wallet-menu__action intuition-wallet-menu__action--warn"
                  onClick={() => {
                    switchToTargetChain?.();
                    setMenuOpen(false);
                  }}
                >
                  {walletStrings.switchNetwork}
                </button>
              ) : null}
              <a
                href={INTUITION_NETWORK_HUB_URL}
                target="_blank"
                rel="noreferrer"
                role="menuitem"
                className="intuition-wallet-menu__action"
              >
                {walletStrings.networkHub}
              </a>
              <button
                type="button"
                role="menuitem"
                disabled={isDisconnecting}
                className="intuition-wallet-menu__action intuition-wallet-menu__action--danger"
                onClick={() => {
                  disconnect();
                  setMenuOpen(false);
                }}
              >
                {walletStrings.disconnect}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const connectTriggerClass =
    variant === "navbar"
      ? "intuition-wallet-trigger intuition-wallet-trigger--navbar intuition-wallet-trigger--connect"
      : "intuition-wallet-trigger intuition-wallet-trigger--panel intuition-wallet-trigger--connect";

  return (
    <div className={shellClass}>
      <button type="button" className={connectTriggerClass} onClick={() => setConnectOpen(true)}>
        {walletStrings.connect}
      </button>
      <IntuitionConnectModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        chainId={targetChain.id}
        networkLabel={networkLabel}
      />
    </div>
  );
}
