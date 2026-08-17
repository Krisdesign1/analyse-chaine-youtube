/* ── Scripts (sous-titres) des premières secondes de vidéo : le "hook" ──
   Réservé à ta propre chaîne : `captions.download` n'est autorisé par
   l'API que pour le propriétaire de la vidéo, via OAuth (scope
   youtube.force-ssl). Impossible d'obtenir le script d'une chaîne tierce
   par ce biais — restriction de la plateforme, pas de cette app. */

const API = "https://www.googleapis.com/youtube/v3";
const HOOK_SECONDS = 25;

function parseSrtTime(t) {
  const m = /(\d+):(\d+):(\d+)[.,](\d+)/.exec(t);
  if (!m) return 0;
  return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000;
}

/* Concatène le texte des répliques dont le début tombe dans les `seconds`
   premières secondes d'un fichier de sous-titres au format SRT. */
export function srtToHook(srt, seconds = HOOK_SECONDS) {
  const blocks = (srt || "").split(/\r?\n\r?\n/);
  const parts = [];
  for (const block of blocks) {
    const rows = block.split(/\r?\n/).filter(Boolean);
    const timingIndex = rows.findIndex((r) => r.includes("-->"));
    if (timingIndex === -1) continue;
    const start = parseSrtTime(rows[timingIndex].split("-->")[0].trim());
    if (start > seconds) break;
    parts.push(rows.slice(timingIndex + 1).join(" "));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

async function listCaptions(accessToken, videoId) {
  const q = new URLSearchParams({ part: "snippet", videoId }).toString();
  const r = await fetch(`${API}/captions?${q}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) return [];
  const j = await r.json();
  return j.items || [];
}

async function downloadCaption(accessToken, captionId) {
  const r = await fetch(`${API}/captions/${captionId}?tfmt=srt`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error("Téléchargement du sous-titre refusé.");
  return await r.text();
}

/* Échantillonne les vidéos les plus et les moins performantes de TA chaîne connectée,
   et récupère le début de leur script pour comparer les accroches. */
export async function fetchHooks(accessToken, videos, { sampleSize = 5, say } = {}) {
  const sorted = [...videos].sort((a, b) => b.rythme - a.rythme);
  const sample = [
    ...sorted.slice(0, sampleSize).map((v) => ({ ...v, group: "top" })),
    ...sorted.slice(-sampleSize).map((v) => ({ ...v, group: "flop" })),
  ];

  const out = [];
  let done = 0;
  for (const v of sample) {
    try {
      const tracks = await listCaptions(accessToken, v.id);
      const track = tracks.find((t) => t.snippet?.trackKind !== "ASR") || tracks[0];
      if (track) {
        const srt = await downloadCaption(accessToken, track.id);
        const hook = srtToHook(srt);
        if (hook) out.push({ id: v.id, title: v.title, rythme: v.rythme, group: v.group, hook });
      }
    } catch (e) {
      // Pas de sous-titres accessibles sur cette vidéo : on l'ignore, sans bloquer les autres.
    }
    done++;
    say?.(`Lecture des scripts… (${done}/${sample.length})`);
  }
  return out;
}
