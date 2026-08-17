/* ── Historique local des analyses passées, par chaîne (gratuit, tout reste dans le navigateur) ── */

const STORAGE_KEY = "yt:snapshots";
const MAX_PER_CHANNEL = 20;

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

function saveAll(all) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {}
}

export function history(channelId) {
  return loadAll()[channelId] || [];
}

/* Le dernier instantané enregistré, avant l'analyse en cours. */
export function lastSnapshot(channelId) {
  const list = history(channelId);
  return list.length ? list[list.length - 1] : null;
}

export function addSnapshot(channelId, snapshot) {
  const all = loadAll();
  const list = all[channelId] || [];
  list.push({ date: new Date().toISOString(), ...snapshot });
  all[channelId] = list.slice(-MAX_PER_CHANNEL);
  saveAll(all);
}

/* Écart entre le dernier instantané enregistré et l'analyse qui vient de tourner. */
export function deltaSince(prev, r, score) {
  if (!prev) return null;
  const days = Math.round((Date.now() - new Date(prev.date).getTime()) / 86400000);
  return {
    days,
    portee: r.stats.portee - prev.portee,
    tendance: r.stats.tendance != null && prev.tendance != null ? r.stats.tendance - prev.tendance : null,
    engagement: r.stats.engagement - prev.engagement,
    subs: r.channel.subs - prev.subs,
    score: score.total - prev.score,
  };
}
