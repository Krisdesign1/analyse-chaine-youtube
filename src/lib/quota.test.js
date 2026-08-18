import { describe, it, expect, beforeEach, vi } from "vitest";

class FakeStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
}

beforeEach(() => {
  globalThis.localStorage = new FakeStorage();
  vi.resetModules();
});

describe("quota", () => {
  it("part de zéro sans historique", async () => {
    const { getQuotaUsed } = await import("./quota");
    expect(getQuotaUsed()).toBe(0);
  });

  it("additionne le coût de chaque appel selon son type", async () => {
    const { recordQuota, getQuotaUsed } = await import("./quota");
    recordQuota("channels.list"); // 1
    recordQuota("search.list"); // 100
    recordQuota("captions.download"); // 200
    expect(getQuotaUsed()).toBe(301);
  });

  it("ignore un type d'appel inconnu (coût 0) sans planter", async () => {
    const { recordQuota, getQuotaUsed } = await import("./quota");
    expect(() => recordQuota("endpoint.inexistant")).not.toThrow();
    expect(getQuotaUsed()).toBe(0);
  });

  it("persiste entre plusieurs lectures le même jour", async () => {
    const { recordQuota, getQuotaUsed } = await import("./quota");
    recordQuota("videos.list");
    recordQuota("videos.list");
    expect(getQuotaUsed()).toBe(2);
    expect(getQuotaUsed()).toBe(2); // relecture stable
  });

  it("survit à un localStorage indisponible sans planter", async () => {
    globalThis.localStorage = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    const { recordQuota, getQuotaUsed } = await import("./quota");
    expect(() => recordQuota("channels.list")).not.toThrow();
    expect(getQuotaUsed()).toBe(0);
  });

  it("repart de zéro sur un jour différent de celui stocké", async () => {
    globalThis.localStorage = new FakeStorage();
    globalThis.localStorage.setItem("yt:quotaUsage", JSON.stringify({ date: "2000-01-01", used: 9999 }));
    const { getQuotaUsed } = await import("./quota");
    expect(getQuotaUsed()).toBe(0);
  });
});

describe("isQuotaError", () => {
  it("reconnaît l'ancien format (error.errors[0].reason)", async () => {
    const { isQuotaError } = await import("./quota");
    const json = { error: { errors: [{ reason: "quotaExceeded" }] } };
    expect(isQuotaError(json, 403)).toBe(true);
  });

  it("reconnaît le nouveau format standardisé (error.status)", async () => {
    const { isQuotaError } = await import("./quota");
    const json = { error: { status: "RESOURCE_EXHAUSTED", message: "peu importe" } };
    expect(isQuotaError(json, 403)).toBe(true);
  });

  it("reconnaît un 403 dont le message mentionne le quota, sans reason ni status connus", async () => {
    const { isQuotaError } = await import("./quota");
    const json = {
      error: { message: "The request cannot be completed because you have exceeded your quota." },
    };
    expect(isQuotaError(json, 403)).toBe(true);
  });

  it("ne déclenche pas sur une autre erreur 403 sans rapport avec le quota", async () => {
    const { isQuotaError } = await import("./quota");
    const json = { error: { message: "Access forbidden for this resource." } };
    expect(isQuotaError(json, 403)).toBe(false);
  });

  it("ne déclenche pas sur une erreur 400 même si le mot quota apparaît ailleurs", async () => {
    const { isQuotaError } = await import("./quota");
    const json = { error: { message: "Invalid quota parameter in request." } };
    expect(isQuotaError(json, 400)).toBe(false);
  });
});
