import { describe, it, expect, beforeEach, vi } from "vitest";

// snapshots.js s'appuie sur window.localStorage (API navigateur) : on la simule en mémoire,
// l'environnement de test Vitest tourne en Node pur sans DOM.
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
  clear() {
    this.store.clear();
  }
}

beforeEach(() => {
  globalThis.localStorage = new FakeStorage();
  vi.resetModules();
});

describe("snapshots", () => {
  it("lastSnapshot renvoie null quand aucun historique n'existe", async () => {
    const { lastSnapshot } = await import("./snapshots");
    expect(lastSnapshot("UC1")).toBeNull();
  });

  it("addSnapshot puis lastSnapshot retrouve le dernier instantané", async () => {
    const { addSnapshot, lastSnapshot } = await import("./snapshots");
    addSnapshot("UC1", { portee: 40, score: 60 });
    const last = lastSnapshot("UC1");
    expect(last.portee).toBe(40);
    expect(last.score).toBe(60);
    expect(last.date).toBeTypeOf("string");
  });

  it("garde l'historique isolé par chaîne", async () => {
    const { addSnapshot, history } = await import("./snapshots");
    addSnapshot("UC1", { portee: 10, score: 10 });
    addSnapshot("UC2", { portee: 90, score: 90 });
    expect(history("UC1")).toHaveLength(1);
    expect(history("UC2")).toHaveLength(1);
    expect(history("UC1")[0].portee).toBe(10);
  });

  it("plafonne l'historique à 20 instantanés par chaîne", async () => {
    const { addSnapshot, history } = await import("./snapshots");
    for (let i = 0; i < 25; i++) addSnapshot("UC1", { portee: i, score: i });
    const h = history("UC1");
    expect(h).toHaveLength(20);
    // Les plus anciens sont éliminés, les plus récents conservés.
    expect(h[h.length - 1].portee).toBe(24);
  });

  it("deltaSince renvoie null sans instantané précédent", async () => {
    const { deltaSince } = await import("./snapshots");
    expect(deltaSince(null, {}, { total: 50 })).toBeNull();
  });

  it("deltaSince calcule l'écart entre le précédent et l'analyse en cours", async () => {
    const { deltaSince } = await import("./snapshots");
    const prev = { date: new Date(Date.now() - 5 * 86400000).toISOString(), portee: 40, tendance: 5, engagement: 2, subs: 500, score: 60 };
    const r = { channel: { subs: 520 }, stats: { portee: 48, tendance: 8, engagement: 2.3 } };
    const delta = deltaSince(prev, r, { total: 65 });
    expect(delta.days).toBe(5);
    expect(delta.portee).toBeCloseTo(8);
    expect(delta.tendance).toBeCloseTo(3);
    expect(delta.subs).toBe(20);
    expect(delta.score).toBe(5);
  });

  it("survit à un localStorage indisponible (mode privé strict) sans planter", async () => {
    globalThis.localStorage = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    const { lastSnapshot, addSnapshot } = await import("./snapshots");
    expect(() => addSnapshot("UC1", { portee: 1, score: 1 })).not.toThrow();
    expect(lastSnapshot("UC1")).toBeNull();
  });

  it("allChannels renvoie un tableau vide sans historique", async () => {
    const { allChannels } = await import("./snapshots");
    expect(allChannels()).toEqual([]);
  });

  it("allChannels liste chaque chaîne avec son dernier score et le delta vs le précédent", async () => {
    const { addSnapshot, allChannels } = await import("./snapshots");
    addSnapshot("UC1", { title: "Chaîne A", portee: 10, score: 40 });
    addSnapshot("UC1", { title: "Chaîne A", portee: 20, score: 55 });
    addSnapshot("UC2", { title: "Chaîne B", portee: 90, score: 80 });

    const all = allChannels();
    expect(all).toHaveLength(2);

    const a = all.find((c) => c.channelId === "UC1");
    expect(a.title).toBe("Chaîne A");
    expect(a.count).toBe(2);
    expect(a.last.score).toBe(55);
    expect(a.scoreDelta).toBe(15);

    const b = all.find((c) => c.channelId === "UC2");
    expect(b.count).toBe(1);
    expect(b.scoreDelta).toBeNull(); // pas de précédent
  });

  it("allChannels trie de la plus récemment analysée à la plus ancienne", async () => {
    const { addSnapshot, allChannels } = await import("./snapshots");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01"));
    addSnapshot("UC_OLD", { title: "Ancienne", score: 10 });
    vi.setSystemTime(new Date("2024-06-01"));
    addSnapshot("UC_NEW", { title: "Récente", score: 20 });
    vi.useRealTimers();

    const all = allChannels();
    expect(all[0].channelId).toBe("UC_NEW");
    expect(all[1].channelId).toBe("UC_OLD");
  });
});
