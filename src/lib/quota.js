/* ── Estimation du quota YouTube Data API v3 consommé aujourd'hui ──
   Additionne le coût documenté de chaque appel fait par l'app (channels.list,
   search.list, etc.). Approximatif : remis à zéro à minuit heure locale, alors
   que le vrai quota Google se remet à zéro à minuit heure du Pacifique — l'écart
   reste faible, c'est un ordre de grandeur, pas un compteur officiel. */

const STORAGE_KEY = "yt:quotaUsage";
export const QUOTA_DAILY_LIMIT = 10000;

export const COSTS = {
  "channels.list": 1,
  "playlistItems.list": 1,
  "videos.list": 1,
  "search.list": 100,
  "commentThreads.list": 1,
  "captions.list": 50,
  "captions.download": 200,
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (raw && raw.date === todayKey()) return raw;
  } catch (e) {}
  return { date: todayKey(), used: 0 };
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
}

/* À appeler juste après chaque appel à l'API (réussi ou non — un appel refusé
   consomme quand même son unité de quota côté Google, sauf s'il est lui-même
   rejeté pour cause de quota déjà épuisé). */
export function recordQuota(endpoint) {
  const cost = COSTS[endpoint] ?? 0;
  const state = load();
  state.used += cost;
  save(state);
  return state.used;
}

export function getQuotaUsed() {
  return load().used;
}
