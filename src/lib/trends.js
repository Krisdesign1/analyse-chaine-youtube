/* ── Recherche de tendances sur toute la plateforme (pas seulement une chaîne) ──
   Usage volontairement manuel et occasionnel : search.list coûte 100 unités
   de quota par appel (contre 1 pour la plupart des autres endpoints). */
import { parseDuration } from "./format";
import { recordQuota } from "./quota";

const API = "https://www.googleapis.com/youtube/v3";

async function call(path, params, key) {
  const q = new URLSearchParams({ ...params, key }).toString();
  const r = await fetch(`${API}/${path}?${q}`);
  recordQuota(`${path}.list`);
  const j = await r.json();
  if (!r.ok) {
    const reason = j?.error?.errors?.[0]?.reason || "";
    if (reason === "quotaExceeded")
      throw new Error("Quota YouTube épuisé pour aujourd'hui. Il se remet à zéro à 9 h (heure de Kinshasa).");
    throw new Error(j?.error?.message || "Recherche refusée par l'API YouTube.");
  }
  return j;
}

export async function searchTrending(query, key, { max = 15, publishedAfter } = {}) {
  const q = (query || "").trim();
  if (!q) throw new Error("Tape un mot-clé pour lancer la recherche.");

  const params = { part: "snippet", type: "video", q, order: "viewCount", maxResults: String(max) };
  if (publishedAfter) params.publishedAfter = publishedAfter;

  const found = await call("search", params, key);
  const ids = (found.items || []).map((it) => it.id?.videoId).filter(Boolean);
  if (!ids.length) return [];

  const details = await call("videos", { part: "snippet,statistics,contentDetails", id: ids.join(",") }, key);
  return (details.items || [])
    .map((v) => ({
      id: v.id,
      title: v.snippet.title,
      channelTitle: v.snippet.channelTitle,
      publishedAt: v.snippet.publishedAt,
      views: +(v.statistics?.viewCount || 0),
      sec: parseDuration(v.contentDetails?.duration),
      thumb: v.snippet.thumbnails?.default?.url,
    }))
    .sort((a, b) => b.views - a.views);
}
