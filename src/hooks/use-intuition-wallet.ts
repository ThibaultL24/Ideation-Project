// src/hooks/use-intuition-wallet.ts
import { useBalance, useSwitchChain } from "wagmi";
import { useIntuitionSdkClients } from "@/hooks/use-intuition-sdk-clients";
import { intuitionNetworkLabel } from "@/lib/web3/intuition-network";

export function useIntuitionWallet() {
  const {
    targetChain,
    address,
    isConnected,
    isOnTargetChain,
    walletClient,
    publicClient,
    multiVaultAddress,
    canWrite,
    isWalletClientLoading,
  } = useIntuitionSdkClients();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId: targetChain.id,
    query: { enabled: Boolean(address && isConnected) },
  });

  async function ensureTargetChain(): Promise<void> {
    if (!isConnected) {
      throw new Error("Connect your wallet first.");
    }
    if (isOnTargetChain) return;
    if (!switchChain) {
      throw new Error(`Switch to ${intuitionNetworkLabel} (chain ${targetChain.id}).`);
    }
    await switchChain({ chainId: targetChain.id });
  }

  return {
    targetChain,
    networkLabel: intuitionNetworkLabel,
    address,
    isConnected,
    isOnTargetChain,
    isWalletClientLoading,
    walletClient,
    publicClient,
    multiVaultAddress,
    balance,
    balanceSymbol: balance?.symbol ?? targetChain.nativeCurrency.symbol,
    isBalanceLoading,
    canTransact: canWrite,
    isSwitching,
    switchToTargetChain: () => switchChain?.({ chainId: targetChain.id }),
    ensureTargetChain,
  };
}
