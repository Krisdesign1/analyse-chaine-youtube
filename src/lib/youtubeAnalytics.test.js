import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchChannelAnalytics, fetchVideoRevenue } from "./youtubeAnalytics";

function jsonResponse(body, ok = true) {
  return { ok, json: async () => body };
}

describe("fetchChannelAnalytics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renvoie les données des groupes qui réussissent même si un groupe échoue", async () => {
    const fetchMock = vi.fn(async (url) => {
      const metrics = new URL(url).searchParams.get("metrics");
      if (metrics.includes("estimatedRevenue")) {
        return jsonResponse({
          columnHeaders: metrics.split(",").map((name) => ({ name })),
          rows: [metrics.split(",").map(() => 42)],
        });
      }
      // Le groupe "base" échoue (ex. droits insuffisants / jeton invalide).
      return jsonResponse({ error: { message: "Insufficient permissions" } }, false);
    });
    vi.stubGlobal("fetch", fetchMock);

    const data = await fetchChannelAnalytics("token", "UCxxx", 90);
    expect(data.estimatedRevenue).toBe(42);
    expect(data._errors.base).toMatch(/Insufficient permissions/);
  });

  it("lève une erreur explicite si tous les groupes échouent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: { message: "Invalid Credentials" } }, false))
    );
    await expect(fetchChannelAnalytics("token", "UCxxx", 90)).rejects.toThrow(/Invalid Credentials/);
  });

  it("construit l'objet de données à partir des colonnes renvoyées par l'API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        const metrics = new URL(url).searchParams.get("metrics").split(",");
        return jsonResponse({
          columnHeaders: metrics.map((name) => ({ name })),
          rows: [metrics.map((_, i) => i)],
        });
      })
    );
    const data = await fetchChannelAnalytics("token", "UCxxx", 30);
    expect(data.days).toBe(30);
    expect(data.views).toBe(0);
  });
});

describe("fetchVideoRevenue", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("indexe les revenus par identifiant de vidéo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          columnHeaders: [{ name: "video" }, { name: "estimatedRevenue" }, { name: "views" }, { name: "cpm" }],
          rows: [
            ["vidA", 12.5, 1000, 3.2],
            ["vidB", 3.1, 200, 1.5],
          ],
        })
      )
    );

    const byVideo = await fetchVideoRevenue("token", "UCxxx", 90);
    expect(byVideo.vidA.estimatedRevenue).toBe(12.5);
    expect(byVideo.vidB.estimatedRevenue).toBe(3.1);
    expect(byVideo.vidInexistante).toBeUndefined();
  });

  it("renvoie un objet vide plutôt que de planter s'il n'y a aucune ligne", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ columnHeaders: [{ name: "video" }, { name: "estimatedRevenue" }], rows: [] }))
    );
    const byVideo = await fetchVideoRevenue("token", "UCxxx", 90);
    expect(byVideo).toEqual({});
  });

  it("lève une erreur explicite si l'API refuse la requête", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: { message: "Access forbidden" } }, false))
    );
    await expect(fetchVideoRevenue("token", "UCxxx", 90)).rejects.toThrow(/Access forbidden/);
  });
});
