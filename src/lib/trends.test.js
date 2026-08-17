import { describe, it, expect, vi, afterEach } from "vitest";
import { searchTrending } from "./trends";

function jsonResponse(body, ok = true) {
  return { ok, json: async () => body };
}

describe("searchTrending", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejette sans mot-clé", async () => {
    await expect(searchTrending("", "KEY")).rejects.toThrow(/mot-clé/i);
  });

  it("enchaîne search puis videos et trie par vues décroissantes", async () => {
    const fetchMock = vi.fn(async (url) => {
      const u = new URL(url);
      if (u.pathname.endsWith("/search")) {
        return jsonResponse({
          items: [{ id: { videoId: "v1" } }, { id: { videoId: "v2" } }],
        });
      }
      if (u.pathname.endsWith("/videos")) {
        return jsonResponse({
          items: [
            {
              id: "v1",
              snippet: { title: "Vidéo 1", channelTitle: "Chaîne A", publishedAt: "2024-01-01T00:00:00Z" },
              statistics: { viewCount: "100" },
              contentDetails: { duration: "PT5M" },
            },
            {
              id: "v2",
              snippet: { title: "Vidéo 2", channelTitle: "Chaîne B", publishedAt: "2024-01-02T00:00:00Z" },
              statistics: { viewCount: "900" },
              contentDetails: { duration: "PT3M" },
            },
          ],
        });
      }
      throw new Error("URL inattendue : " + url);
    });
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchTrending("test", "KEY");
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe("v2"); // 900 vues > 100 vues
    expect(results[0].views).toBe(900);
  });

  it("renvoie un tableau vide si la recherche ne trouve rien", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ items: [] }))
    );
    const results = await searchTrending("introuvable", "KEY");
    expect(results).toEqual([]);
  });

  it("traduit une erreur de quota", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: { errors: [{ reason: "quotaExceeded" }] } }, false))
    );
    await expect(searchTrending("test", "KEY")).rejects.toThrow(/quota/i);
  });
});
