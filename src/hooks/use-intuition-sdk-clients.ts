// src/hooks/use-intuition-sdk-clients.ts
import { getMultiVaultAddressFromChainId } from "@0xintuition/protocol";
import { useChainId, useConnection, usePublicClient, useWalletClient } from "wagmi";
import { INTUITION_TARGET_CHAIN } from "@/lib/web3/intuition-network";

export function useIntuitionSdkClients() {
  const targetChain = INTUITION_TARGET_CHAIN;
  const chainId = useChainId();
  const { address, isConnected } = useConnection();
  const { data: walletClient, isLoading: isWalletClientLoading } = useWalletClient();
  const publicClient = usePublicClient({ chainId: targetChain.id });

  const effectiveChainId = chainId || targetChain.id;
  const multiVaultAddress = getMultiVaultAddressFromChainId(effectiveChainId);
  const isOnTargetChain = !isConnected || chainId === targetChain.id;

  const canWrite = Boolean(
    isConnected && address && walletClient?.account && publicClient && isOnTargetChain,
  );

  return {
    targetChain,
    chainId: effectiveChainId,
    address,
    isConnected,
    isOnTargetChain,
    isWalletClientLoading,
    walletClient: canWrite ? walletClient : undefined,
    publicClient,
    multiVaultAddress,
    canWrite,
  };
}
