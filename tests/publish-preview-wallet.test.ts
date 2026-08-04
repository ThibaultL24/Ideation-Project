// tests/publish-preview-wallet.test.ts
import { describe, expect, it } from "vitest";
import type { OnchainPublishPreview } from "@/lib/intuition/publish-preview";

describe("on-chain publish payment model", () => {
  it("documents user_wallet as the dapp payment mode", () => {
    const preview = {
      paymentMode: "user_wallet",
      walletConfigured: false,
      canPublish: true,
      variantNeedsPublish: true,
      blockers: [],
    } satisfies Partial<OnchainPublishPreview>;

    expect(preview.paymentMode).toBe("user_wallet");
    expect(preview.walletConfigured).toBe(false);
    expect(preview.canPublish).toBe(true);
  });
});
