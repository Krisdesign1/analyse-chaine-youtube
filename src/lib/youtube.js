import { median, parseDuration, ageDays, dayName } from "./format";
import { recordQuota } from "./quota";

const API = "https://www.googleapis.com/youtube/v3";

/* ── Extraction de l'identifiant depuis un lien ────────────────────── */
export function readLink(raw) {
  const s = (raw || "").trim();
  if (!s) return null;
  let m;
  if ((m = s.match(/channel\/(UC[\w-]{20,})/))) return { type: "id", value: m[1] };
  if ((m = s.match(/^(UC[\w-]{20,})$/))) return { type: "id", value: m[1] };
  if ((m = s.match(/@([\w.\-]+)/))) return { type: "handle", value: m[1] };
  if ((m = s.match(/\/user\/([\w.\-]+)/))) return { type: "user", value: m[1] };
  if ((m = s.match(/\/c\/([\w.\-]+)/))) return { type: "search", value: m[1] };
  return { type: "search", value: s };
}

async function call(path, params, key) {
  const q = new URLSearchParams({ ...params, key }).toString();
  const r = await fetch(`${API}/${path}?${q}`);
  recordQuota(`${path}.list`);
  const j = await r.json();
  if (!r.ok) {
    const reason = j?.error?.errors?.[0]?.reason || "";
    if (reason === "quotaExceeded")
      throw new Error("Quota YouTube épuisé pour aujourd'hui. Il se remet à zéro à 9 h (heure de Kinshasa).");
    if (reason === "keyInvalid" || r.status === 400)
      throw new Error("Clé API refusée. Vérifie qu'elle est active et que l'API YouTube Data v3 est activée.");
    throw new Error(j?.error?.message || "L'API YouTube a refusé la requête.");
  }
  return j;
}

/* ── Récupération + calculs ────────────────────────────────────────── */
export async function analyse(link, key, say) {
  const ref = readLink(link);
  if (!ref) throw new Error("Colle un lien de chaîne pour lancer l'analyse.");
  if (!key) throw new Error("Ajoute une clé API YouTube avant de lancer une analyse.");

  say("Recherche de la chaîne…");
  let params = { part: "snippet,statistics,contentDetails" };
  if (ref.type === "id") params.id = ref.value;
  else if (ref.type === "handle") params.forHandle = "@" + ref.value;
  else if (ref.type === "user") params.forUsername = ref.value;

  let data = ref.type === "search" ? { items: [] } : await call("channels", params, key);

  if (!data.items?.length) {
    const found = await call(
      "search",
      { part: "snippet", type: "channel", maxResults: "1", q: ref.value },
      key
    );
    const id = found.items?.[0]?.snippet?.channelId || found.items?.[0]?.id?.channelId;
    if (!id) throw new Error("Aucune chaîne trouvée pour ce lien.");
    data = await call("channels", { part: "snippet,statistics,contentDetails", id }, key);
  }

  const ch = data.items[0];
  const uploads = ch.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error("Cette chaîne ne publie aucune vidéo visible.");

  say("Lecture des vidéos…");
  let ids = [];
  let page;
  do {
    const p = await call(
      "playlistItems",
      { part: "contentDetails", playlistId: uploads, maxResults: "50", ...(page ? { pageToken: page } : {}) },
      key
    );
    ids.push(...p.items.map((x) => x.contentDetails.videoId));
    page = p.nextPageToken;
    say(`Lecture des vidéos… (${ids.length} trouvées)`);
  } while (page);
  if (!ids.length) throw new Error("Aucune vidéo publique sur cette chaîne.");

  const vids = [];
  for (let i = 0; i < ids.length; i += 50) {
    const v = await call(
      "videos",
      { part: "snippet,statistics,contentDetails", id: ids.slice(i, i + 50).join(",") },
      key
    );
    vids.push(...v.items);
    say(`Calcul des indicateurs… (${vids.length}/${ids.length})`);
  }

  const videos = vids
    .map((v) => {
      const views = +(v.statistics?.viewCount || 0);
      const age = ageDays(v.snippet.publishedAt);
      const sec = parseDuration(v.contentDetails?.duration);
      return {
        id: v.id,
        title: v.snippet.title,
        date: v.snippet.publishedAt,
        views,
        likes: +(v.statistics?.likeCount || 0),
        comments: +(v.statistics?.commentCount || 0),
        tags: v.snippet.tags || [],
        sec,
        age,
        rythme: views / age,
        format: sec <= 180 ? "Short" : sec <= 1200 ? "Standard" : "Longue",
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const subs = +(ch.statistics?.subscriberCount || 0);
  const rythmes = videos.map((v) => v.rythme);
  const medRythme = median(rythmes);
  const medViews = median(videos.map((v) => v.views));

  const gaps = [];
  for (let i = 0; i < Math.min(videos.length - 1, 30); i++)
    gaps.push((new Date(videos[i].date) - new Date(videos[i + 1].date)) / 86400000);

  const recents = videos.slice(0, 10).map((v) => v.rythme);
  const avant = videos.slice(10, 20).map((v) => v.rythme);
  const tendance = avant.length ? (median(recents) / (median(avant) || 1) - 1) * 100 : null;

  const parFormat = ["Short", "Standard", "Longue"].map((f) => {
    const g = videos.filter((v) => v.format === f);
    return { format: f, n: g.length, med: median(g.map((v) => v.rythme)) };
  });

  const parJour = {};
  videos.forEach((v) => {
    const j = dayName(v.date);
    (parJour[j] = parJour[j] || []).push(v.rythme);
  });
  const jours = Object.entries(parJour)
    .map(([j, r]) => ({ jour: j, n: r.length, med: median(r) }))
    .sort((a, b) => b.med - a.med);

  const engagement =
    videos.reduce((s, v) => s + (v.views ? (v.likes + v.comments) / v.views : 0), 0) / videos.length;
  const likeRate = videos.reduce((s, v) => s + (v.views ? v.likes / v.views : 0), 0) / videos.length;
  const commentRate = videos.reduce((s, v) => s + (v.views ? v.comments / v.views : 0), 0) / videos.length;

  // Régularité : écart interquartile du rythme rapporté à sa médiane (plus bas = plus prévisible d'une vidéo à l'autre).
  const sortedR = [...rythmes].sort((a, b) => a - b);
  const q1 = sortedR[Math.floor(sortedR.length * 0.25)] || 0;
  const q3 = sortedR[Math.floor(sortedR.length * 0.75)] || 0;
  const regularite = medRythme ? (q3 - q1) / medRythme : 0;

  // Longueur de titre vs performance
  const parTitre = ["Court (< 40 car.)", "Moyen (40-70 car.)", "Long (> 70 car.)"].map((label, i) => {
    const g = videos.filter((v) => {
      const len = v.title.length;
      return i === 0 ? len < 40 : i === 1 ? len >= 40 && len <= 70 : len > 70;
    });
    return { label, n: g.length, med: median(g.map((v) => v.rythme)) };
  });

  // Historique mensuel sur toute la durée de la chaîne (pas seulement les dernières vidéos).
  const parMois = {};
  videos.forEach((v) => {
    const d = new Date(v.date);
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    (parMois[cle] = parMois[cle] || []).push(v);
  });
  const historique = Object.entries(parMois)
    .map(([mois, vs]) => ({
      mois,
      n: vs.length,
      vues: vs.reduce((s, v) => s + v.views, 0),
      medRythme: median(vs.map((v) => v.rythme)),
    }))
    .sort((a, b) => a.mois.localeCompare(b.mois));
  const videosParMois = videos.length / Math.max(1, historique.length);

  return {
    channel: {
      id: ch.id,
      title: ch.snippet.title,
      subs,
      totalViews: +(ch.statistics?.viewCount || 0),
      videoCount: +(ch.statistics?.videoCount || 0),
      thumb: ch.snippet.thumbnails?.default?.url,
      created: ch.snippet.publishedAt,
    },
    videos,
    stats: {
      medViews,
      medRythme,
      portee: subs ? (medViews / subs) * 100 : 0,
      cadence: median(gaps),
      tendance,
      engagement: engagement * 100,
      likeRate: likeRate * 100,
      commentRate: commentRate * 100,
      regularite,
      videosParMois,
      parFormat,
      parTitre,
      jours,
      historique,
      top: [...videos].sort((a, b) => b.rythme - a.rythme).slice(0, 5),
      flop: [...videos].sort((a, b) => a.rythme - b.rythme).slice(0, 5),
    },
  };
}
