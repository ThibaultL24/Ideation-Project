// tests/pinata-pin-backend.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { resolvePinBackend } from "@/lib/intuition/pin-thing";

const KEYS = ["INTUITION_PIN_API_KEY", "PINATA_JWT", "PINATA_API_JWT"] as const;

describe("resolvePinBackend", () => {
  const previous = new Map<string, string | undefined>();

  afterEach(() => {
    for (const key of KEYS) {
      if (previous.has(key)) {
        const value = previous.get(key);
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
    previous.clear();
  });

  function setEnv(key: (typeof KEYS)[number], value: string | undefined) {
    if (!previous.has(key)) previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  it("prefers intuition over pinata", () => {
    setEnv("INTUITION_PIN_API_KEY", "int-key");
    setEnv("PINATA_JWT", "pinata-key");
    expect(resolvePinBackend()).toBe("intuition");
  });

  it("falls back to pinata when intuition key is missing", () => {
    setEnv("INTUITION_PIN_API_KEY", undefined);
    setEnv("PINATA_JWT", undefined);
    setEnv("PINATA_API_JWT", "alias-jwt");
    expect(resolvePinBackend()).toBe("pinata");
  });

  it("returns null when no credential is set", () => {
    setEnv("INTUITION_PIN_API_KEY", undefined);
    setEnv("PINATA_JWT", undefined);
    setEnv("PINATA_API_JWT", undefined);
    expect(resolvePinBackend()).toBeNull();
  });
});
