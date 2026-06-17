"use client";

// src/components/wallet/intuition-wallet-panel.tsx
import { IntuitionConnectButton } from "@/components/wallet/intuition-connect-button";
import { IntuitionWalletAvatar } from "@/components/wallet/intuition-wallet-avatar";
import { useIntuitionWallet } from "@/hooks/use-intuition-wallet";
import { formatTokenBalance } from "@/lib/web3/format-balance";
import { formatWalletAddress } from "@/lib/web3/format-wallet-address";
import { walletStrings } from "@/lib/strings/wallet";

export function IntuitionWalletPanel() {
  const {
    targetChain,
    networkLabel,
    isConnected,
    address,
    isOnTargetChain,
    canTransact,
    multiVaultAddress,
    balance,
    balanceSymbol,
    isBalanceLoading,
    isSwitching,
    switchToTargetChain,
  } = useIntuitionWallet();

  return (
    <div className="agora-intuition-wallet rounded-xl border border-(--agora-intuition-border) bg-(--agora-intuition-surface) p-4 shadow-(--agora-intuition-shadow)">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--agora-intuition-gold)">
            {walletStrings.panelKicker}
          </p>
          <h3 className="mt-1 text-sm font-semibold tracking-tight text-(--agora-intuition-heading)">
            {walletStrings.panelTitle}
          </h3>
          <p className="mt-2 max-w-prose text-xs leading-relaxed text-(--agora-intuition-muted)">
            {walletStrings.panelLead}
          </p>
        </div>
        <IntuitionConnectButton variant="panel" />
      </div>

      {isConnected && address ? (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-(--agora-intuition-border) bg-(--color-bg-surface) px-3 py-2.5">
          <IntuitionWalletAvatar address={address} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-(--agora-intuition-heading)">
              {formatWalletAddress(address)}
            </p>
            <p className="truncate font-mono text-[10px] text-(--agora-intuition-dim)">{address}</p>
            {!isBalanceLoading && balance != null ? (
              <p className="mt-1 text-xs font-medium tabular-nums text-(--agora-intuition-muted)">
                {formatTokenBalance(balance.value, balance.decimals)} {balanceSymbol}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {isConnected && !isOnTargetChain ? (
        <div
          className="mt-4 flex flex-col gap-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p className="text-xs leading-snug text-amber-100/90">
            {walletStrings.wrongNetwork.replace("{chainId}", String(targetChain.id))}
          </p>
          <button
            type="button"
            disabled={isSwitching}
            className="shrink-0 rounded-md border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-50 disabled:opacity-50"
            onClick={() => switchToTargetChain?.()}
          >
            {walletStrings.switchNetwork}
          </button>
        </div>
      ) : null}

      <dl className="mt-4 grid gap-2 text-[11px] sm:grid-cols-2">
        <div className="rounded-md border border-(--agora-intuition-border) bg-(--color-bg-surface) px-2.5 py-2">
          <dt className="font-medium uppercase tracking-wide text-(--agora-intuition-dim)">
            {walletStrings.identityLabel}
          </dt>
          <dd className="mt-0.5 text-(--agora-intuition-heading)">
            {isConnected && address ? walletStrings.walletMode : walletStrings.anonymous}
          </dd>
        </div>
        <div className="rounded-md border border-(--agora-intuition-border) bg-(--color-bg-surface) px-2.5 py-2">
          <dt className="font-medium uppercase tracking-wide text-(--agora-intuition-dim)">
            {walletStrings.protocolReady}
          </dt>
          <dd className="mt-0.5 text-(--agora-intuition-heading)">
            {canTransact ? walletStrings.readyYes : walletStrings.readyNo}
          </dd>
        </div>
        <div className="rounded-md border border-(--agora-intuition-border) bg-(--color-bg-surface) px-2.5 py-2 sm:col-span-2">
          <dt className="font-medium uppercase tracking-wide text-(--agora-intuition-dim)">
            MultiVault · {networkLabel}
          </dt>
          <dd
            className="mt-0.5 truncate font-mono text-[10px] text-(--agora-intuition-muted)"
            title={multiVaultAddress}
          >
            {multiVaultAddress}
          </dd>
        </div>
      </dl>
    </div>
  );
}
