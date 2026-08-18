/* ── Estimation du quota YouTube Data API v3 consommé aujourd'hui ──
   Additionne le coût documenté de chaque appel fait par l'app. Approximatif : remis
   à zéro à minuit heure locale, alors que le vrai quota Google se remet à zéro à
   minuit heure du Pacifique — l'écart reste faible, c'est un ordre de grandeur, pas
   un compteur officiel.

   Deux paniers séparés, vérifiés sur la documentation officielle Google
   (developers.google.com/youtube/v3/determine_quota_cost) :
   - le panier principal (10 000 unités/jour), partagé par la plupart des endpoints ;
   - search.list a SON PROPRE panier ("Search Queries"), 100 appels/jour à 1 unité
     chacun, totalement indépendant du panier principal. Le compter dans le même
     total que le reste (comme une version précédente de ce fichier le faisait, à
     100 unités) exagérait fortement son coût réel. */

const STORAGE_KEY = "yt:quotaUsage";
export const QUOTA_DAILY_LIMIT = 10000;
export const SEARCH_DAILY_LIMIT = 100;

const SEARCH_ENDPOINT = "search.list";

export const COSTS = {
  "channels.list": 1,
  "playlistItems.list": 1,
  "videos.list": 1,
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
  return { date: todayKey(), used: 0, searchCalls: 0 };
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
  const state = load();
  if (endpoint === SEARCH_ENDPOINT) {
    state.searchCalls = (state.searchCalls || 0) + 1;
  } else {
    state.used += COSTS[endpoint] ?? 0;
  }
  save(state);
  return state;
}

export function getQuotaUsed() {
  return load().used;
}

export function getSearchCalls() {
  return load().searchCalls || 0;
}

export const QUOTA_MESSAGE = "Quota YouTube épuisé pour aujourd'hui. Il se remet à zéro à 9 h (heure de Kinshasa).";

/* Détecte une erreur de quota quel que soit le format renvoyé par Google : l'ancien
   (error.errors[0].reason === "quotaExceeded"), le nouveau standardisé
   (error.status === "RESOURCE_EXHAUSTED"), ou en dernier recours un 403 dont le
   message mentionne "quota" en toutes lettres — pour ne jamais laisser passer le
   message brut de Google faute d'avoir deviné le bon format. */
export function isQuotaError(json, status) {
  const err = json?.error;
  const reason = err?.errors?.[0]?.reason || "";
  if (reason === "quotaExceeded") return true;
  if (err?.status === "RESOURCE_EXHAUSTED") return true;
  if (status === 403 && /quota/i.test(err?.message || "")) return true;
  return false;
}
