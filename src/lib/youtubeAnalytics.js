/* ── Données privées via l'API YouTube Analytics (nécessite une connexion OAuth) ──
   Les métriques sont interrogées par petits groupes indépendants : si l'un des
   groupes est refusé par l'API (ex. revenus sur une chaîne non monétisée), les
   autres groupes restent quand même disponibles au lieu que tout échoue en bloc. */

const BASE = "https://youtubeanalytics.googleapis.com/v2/reports";

// "impressions" et "impressionsClickThroughRate" (CTR des miniatures affiché dans YouTube
// Studio) ne sont pas exposées par l'API YouTube Analytics publique — l'API renvoie
// littéralement "Unknown identifier" pour ces noms, ce n'est pas un problème de nommage
// mais une donnée que Google ne rend disponible qu'à l'intérieur de Studio, pas via l'API.
const GROUPS = {
  base: ["views", "estimatedMinutesWatched", "averageViewDuration", "averageViewPercentage", "subscribersGained", "subscribersLost"],
  revenue: ["estimatedRevenue", "estimatedAdRevenue", "cpm", "adImpressions"],
};

const isoDate = (d) => d.toISOString().slice(0, 10);

async function query(accessToken, channelId, days, metrics) {
  const end = new Date();
  const start = new Date(Date.now() - days * 86400000);
  const params = new URLSearchParams({
    ids: `channel==${channelId}`,
    startDate: isoDate(start),
    endDate: isoDate(end),
    metrics: metrics.join(","),
  });

  const r = await fetch(`${BASE}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || "Requête refusée par l'API YouTube Analytics.");

  const headers = (j.columnHeaders || []).map((h) => h.name);
  const row = j.rows?.[0] || [];
  const data = {};
  headers.forEach((h, i) => (data[h] = row[i]));
  return data;
}

/* Interroge chaque groupe séparément. Si aucun des trois ne passe, l'erreur du
   groupe de base (le plus susceptible d'expliquer un problème général : jeton,
   droits, chaîne introuvable) est renvoyée à l'appelant. */
export async function fetchChannelAnalytics(accessToken, channelId, days = 90) {
  const result = { days };
  const errors = {};
  let anySucceeded = false;

  for (const [name, metrics] of Object.entries(GROUPS)) {
    try {
      Object.assign(result, await query(accessToken, channelId, days, metrics));
      anySucceeded = true;
    } catch (e) {
      errors[name] = e.message;
    }
  }

  if (!anySucceeded) throw new Error(errors.base || "Impossible de récupérer les statistiques privées de la chaîne.");

  return { ...result, _errors: errors };
}

/* Revenus estimés vidéo par vidéo (dimensions=video), plutôt qu'un seul total agrégé sur la
   chaîne. Ne renvoie que les vidéos ayant généré des revenus sur la période — une vidéo absente
   n'a simplement rien rapporté (ou n'est pas monétisée), ce n'est pas une erreur. */
export async function fetchVideoRevenue(accessToken, channelId, days = 90) {
  const end = new Date();
  const start = new Date(Date.now() - days * 86400000);
  const params = new URLSearchParams({
    ids: `channel==${channelId}`,
    startDate: isoDate(start),
    endDate: isoDate(end),
    metrics: "estimatedRevenue,views,cpm",
    dimensions: "video",
    sort: "-estimatedRevenue",
    maxResults: "200",
  });

  const r = await fetch(`${BASE}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || "Impossible de récupérer les revenus par vidéo.");

  const headers = (j.columnHeaders || []).map((h) => h.name);
  const videoIndex = headers.indexOf("video");
  const revenueIndex = headers.indexOf("estimatedRevenue");
  const cpmIndex = headers.indexOf("cpm");

  const byVideoId = {};
  (j.rows || []).forEach((row) => {
    if (videoIndex === -1) return;
    byVideoId[row[videoIndex]] = {
      estimatedRevenue: revenueIndex !== -1 ? row[revenueIndex] : null,
      cpm: cpmIndex !== -1 ? row[cpmIndex] : null,
    };
  });
  return byVideoId;
}
