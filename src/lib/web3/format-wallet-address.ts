// src/lib/web3/format-wallet-address.ts

export function formatWalletAddress(address: string | undefined | null): string {
  if (!address) return "";
  if (address.startsWith("did:")) {
    const ethAddress = address.slice(4);
    return `did:${ethAddress.slice(0, 6)}…${ethAddress.slice(-4)}`;
  }
  if (address.endsWith(".eth")) return address;
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
