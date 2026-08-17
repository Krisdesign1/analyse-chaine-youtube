import { describe, it, expect, vi, afterEach } from "vitest";
import { readLink, analyse } from "./youtube";

describe("readLink", () => {
  it("reconnaît un ID de chaîne dans une URL /channel/", () => {
    const id = "UC" + "x".repeat(22);
    expect(readLink(`https://www.youtube.com/channel/${id}`)).toEqual({ type: "id", value: id });
  });

  it("reconnaît un ID de chaîne collé seul", () => {
    const id = "UC" + "x".repeat(22);
    expect(readLink(id)).toEqual({ type: "id", value: id });
  });

  it("reconnaît un handle @pseudo", () => {
    expect(readLink("https://www.youtube.com/@lachaine")).toEqual({ type: "handle", value: "lachaine" });
  });

  it("reconnaît un ancien /user/", () => {
    expect(readLink("https://www.youtube.com/user/pseudo")).toEqual({ type: "user", value: "pseudo" });
  });

  it("bascule en recherche pour un ancien /c/ (non résolvable directement)", () => {
    expect(readLink("https://www.youtube.com/c/pseudo")).toEqual({ type: "search", value: "pseudo" });
  });

  it("bascule en recherche pour un texte libre", () => {
    expect(readLink("nom de chaîne quelconque")).toEqual({ type: "search", value: "nom de chaîne quelconque" });
  });

  it("renvoie null pour une entrée vide", () => {
    expect(readLink("")).toBeNull();
    expect(readLink("   ")).toBeNull();
    expect(readLink(null)).toBeNull();
  });
});

describe("analyse", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejette sans clé API avec un message clair", async () => {
    await expect(analyse("@x", "", () => {})).rejects.toThrow(/clé API/i);
  });

  it("rejette sans lien exploitable", async () => {
    await expect(analyse("", "FAKE_KEY", () => {})).rejects.toThrow(/lien/i);
  });

  it("assemble un résultat complet à partir de réponses API mockées", async () => {
    const channelId = "UC" + "x".repeat(22);
    const videoIds = Array.from({ length: 3 }, (_, i) => `VID${i}`);

    const fetchMock = vi.fn(async (url) => {
      const u = new URL(url);
      if (u.pathname.endsWith("/channels")) {
        return jsonResponse({
          items: [
            {
              id: channelId,
              snippet: { title: "Ma Chaîne", publishedAt: "2020-01-01T00:00:00Z", thumbnails: { default: { url: "x.jpg" } } },
              statistics: { subscriberCount: "1000", viewCount: "50000", videoCount: "3" },
              contentDetails: { relatedPlaylists: { uploads: "UUxxxx" } },
            },
          ],
        });
      }
      if (u.pathname.endsWith("/playlistItems")) {
        return jsonResponse({ items: videoIds.map((id) => ({ contentDetails: { videoId: id } })) });
      }
      if (u.pathname.endsWith("/videos")) {
        return jsonResponse({
          items: videoIds.map((id, i) => ({
            id,
            snippet: { title: `Vidéo ${i}`, publishedAt: new Date(Date.now() - (i + 1) * 86400000).toISOString() },
            statistics: { viewCount: String(1000 * (i + 1)), likeCount: "10", commentCount: "2" },
            contentDetails: { duration: "PT5M" },
          })),
        });
      }
      throw new Error("URL inattendue dans le test : " + url);
    });
    vi.stubGlobal("fetch", fetchMock);

    const steps = [];
    const r = await analyse("@machaine", "FAKE_KEY", (s) => steps.push(s));

    expect(r.channel.id).toBe(channelId);
    expect(r.channel.subs).toBe(1000);
    expect(r.videos).toHaveLength(3);
    expect(r.stats.medViews).toBeGreaterThan(0);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("traduit une erreur de quota YouTube en message compréhensible", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ error: { errors: [{ reason: "quotaExceeded" }] } }, 403)
      )
    );
    await expect(analyse("@x", "FAKE_KEY", () => {})).rejects.toThrow(/quota/i);
  });
});

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}
