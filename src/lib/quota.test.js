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
