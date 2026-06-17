// src/lib/strings/wallet.ts

export const walletStrings = {
  panelKicker: "Intuition testnet",
  panelTitle: "Wallet & attestation",
  panelLead:
    "Connect a wallet on Intuition testnet (wagmi + viem). Same panel as Intuition Portal and Talaria.",
  connect: "Connect wallet",
  connectModalTitle: "Connect a wallet",
  disconnect: "Disconnect",
  close: "Close",
  getWallet: "Get a wallet",
  learnMore: "Learn more",
  walletEduTitle: "What is a wallet?",
  walletEduAssetsTitle: "A home for your digital assets",
  walletEduAssetsBody:
    "Wallets are used to send, receive, store, and display digital assets like ETH and NFTs.",
  walletEduLoginTitle: "A new way to log in",
  walletEduLoginBody:
    "Instead of creating new accounts and passwords on every website, just connect your wallet.",
  connectHint:
    "Connect on {network} (wagmi + viem). Add the network in your wallet if prompted.",
  wrongNetwork:
    "Switch to Intuition (chain {chainId}) for tTRUST and on-chain transactions.",
  switchNetwork: "Switch network",
  networkHub: "Intuition network hub (faucet & bridge)",
  protocolReady: "Protocol clients",
  readyYes: "wallet + RPC ready",
  readyNo: "connect wallet on target chain",
  identityLabel: "Participant mode",
  walletMode: "Wallet-bound",
  anonymous: "Browser session",
  panelLoading: "Loading wallet panel…",
} as const;
