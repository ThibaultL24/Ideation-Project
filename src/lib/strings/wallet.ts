// src/lib/strings/wallet.ts

export const walletStrings = {
  panelTitle: "Wallet",
  panelLead:
    "Connect a wallet on the Intuition network to sign on-chain attestations (atoms and triples).",
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
    "Connected on {network}. Add the Intuition network in your wallet if prompted.",
  wrongNetwork:
    "Switch to {network} (chain {chainId}) to use {symbol} and publish on-chain.",
  switchNetwork: "Switch network",
  networkHub: "Intuition network hub",
  protocolReady: "Ready to publish",
  readyYes: "Wallet connected on target chain",
  readyNo: "Connect wallet on the Intuition network",
  identityLabel: "Session",
  walletMode: "Wallet connected",
  anonymous: "Not connected",
  panelLoading: "Loading wallet panel…",
} as const;
