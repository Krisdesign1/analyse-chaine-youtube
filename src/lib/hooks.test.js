import { describe, it, expect, vi, afterEach } from "vitest";
import { srtToHook, fetchHooks } from "./hooks";

const SAMPLE_SRT = `1
00:00:00,000 --> 00:00:03,500
Salut à tous, bienvenue

2
00:00:03,500 --> 00:00:07,000
sur cette nouvelle vidéo.

3
00:00:30,000 --> 00:00:33,000
Ceci arrive bien après 25 secondes.
`;

describe("srtToHook", () => {
  it("ne garde que les répliques des 25 premières secondes par défaut", () => {
    const hook = srtToHook(SAMPLE_SRT);
    expect(hook).toContain("Salut à tous");
    expect(hook).toContain("nouvelle vidéo");
    expect(hook).not.toContain("25 secondes");
  });

  it("respecte un seuil personnalisé", () => {
    const hook = srtToHook(SAMPLE_SRT, 40);
    expect(hook).toContain("25 secondes");
  });

  it("ne plante pas sur une entrée vide ou malformée", () => {
    expect(srtToHook("")).toBe("");
    expect(srtToHook(undefined)).toBe("");
    expect(srtToHook("texte sans timing")).toBe("");
  });
});

describe("fetchHooks", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ignore une vidéo sans sous-titres accessibles sans bloquer les autres", async () => {
    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        call++;
        if (String(url).includes("/captions?")) {
          // La première vidéo n'a pas de sous-titres, la seconde en a.
          if (call === 1) return { ok: true, json: async () => ({ items: [] }) };
          return { ok: true, json: async () => ({ items: [{ id: "cap1", snippet: { trackKind: "standard" } }] }) };
        }
        // Téléchargement du sous-titre.
        return { ok: true, text: async () => SAMPLE_SRT };
      })
    );

    const videos = [
      { id: "a", title: "Vidéo A", rythme: 100 },
      { id: "b", title: "Vidéo B", rythme: 1 },
    ];
    const out = await fetchHooks("token", videos, { sampleSize: 1 });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("b");
    expect(out[0].hook).toContain("Salut à tous");
  });

  it("ne consulte pas deux fois la même vidéo quand top et flop se chevauchent (petite chaîne)", async () => {
    const captionsListCalls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        if (String(url).includes("/captions?")) {
          captionsListCalls.push(new URL(url).searchParams.get("videoId"));
          return { ok: true, json: async () => ({ items: [] }) }; // pas de sous-titres, peu importe ici
        }
        return { ok: true, text: async () => SAMPLE_SRT };
      })
    );

    // 3 vidéos seulement, sampleSize par défaut (5) : top5 et flop5 se chevauchent entièrement.
    const videos = [
      { id: "a", title: "A", rythme: 3 },
      { id: "b", title: "B", rythme: 2 },
      { id: "c", title: "C", rythme: 1 },
    ];
    await fetchHooks("token", videos);

    expect(captionsListCalls).toHaveLength(3);
    expect(new Set(captionsListCalls).size).toBe(3);
  });
});
