/* ── Analyse du texte réel des commentaires (pas juste leur nombre) ──
   Public, clé API simple, pas d'OAuth requis. Se limite à un échantillon
   (top + flop) pour garder le coût en quota raisonnable sur une chaîne
   de plusieurs centaines de vidéos. */
import { tokenize } from "./text";

const API = "https://www.googleapis.com/youtube/v3";

const QUESTION_WORDS = [
  "comment", "pourquoi", "quand", "combien", "quel", "quelle", "quels", "quelles", "est-ce",
];

async function fetchComments(videoId, key, maxResults = 50) {
  const q = new URLSearchParams({
    part: "snippet",
    videoId,
    maxResults: String(maxResults),
    order: "relevance",
    key,
  }).toString();
  const r = await fetch(`${API}/commentThreads?${q}`);
  if (!r.ok) return []; // commentaires désactivés, vidéo privée, etc. : on ignore cette vidéo sans bloquer l'ensemble
  const j = await r.json();
  return (j.items || [])
    .map((it) => it.snippet?.topLevelComment?.snippet?.textOriginal || "")
    .filter(Boolean);
}

/* Échantillonne les vidéos les plus et les moins performantes, récupère leurs commentaires
   les plus pertinents, et en tire les mots qui reviennent le plus souvent ainsi que des
   questions fréquemment posées (bonnes pistes de futurs sujets). */
export async function analyseComments(videos, key, { sampleSize = 10, say } = {}) {
  const sorted = [...videos].sort((a, b) => b.rythme - a.rythme);
  const sample = [...sorted.slice(0, sampleSize), ...sorted.slice(-sampleSize)];
  const uniqueSample = [...new Map(sample.map((v) => [v.id, v])).values()];

  const allComments = [];
  let done = 0;
  for (const v of uniqueSample) {
    const c = await fetchComments(v.id, key);
    allComments.push(...c);
    done++;
    say?.(`Lecture des commentaires… (${done}/${uniqueSample.length} vidéos)`);
  }

  if (!allComments.length) return null;

  const freq = new Map();
  allComments.forEach((text) => {
    new Set(tokenize(text)).forEach((w) => freq.set(w, (freq.get(w) || 0) + 1));
  });
  const topWords = [...freq.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word, n]) => ({ word, n }));

  const questions = allComments.filter(
    (t) => t.trim().endsWith("?") || (t.includes("?") && QUESTION_WORDS.some((q) => t.toLowerCase().includes(q)))
  );
  const sampleQuestions = [...new Set(questions)]
    .filter((q) => q.length <= 200)
    .slice(0, 8);

  return {
    videosAnalysed: uniqueSample.length,
    commentsAnalysed: allComments.length,
    topWords,
    sampleQuestions,
  };
}
