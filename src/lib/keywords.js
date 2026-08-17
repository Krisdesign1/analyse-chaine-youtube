/* ── Mots qui reviennent plus souvent dans les titres qui percent que dans ceux qui flop ── */
import { tokenize } from "./text";

// Mots vides propres aux titres (souvent du remplissage générique type "Comment faire X").
const TITLE_STOPWORDS = ["plus", "comment", "pourquoi", "quoi", "tout", "tous", "toute", "toutes"];

/* Compare les mots présents dans les titres les mieux classés (par rythme) à ceux des
   moins bien classés. `n` détermine la taille de chaque groupe (par défaut ~25% des vidéos,
   au moins 5). Un mot n'est compté qu'une fois par titre, même s'il y apparaît plusieurs fois. */
export function keywordSignals(videos, n = Math.max(5, Math.floor(videos.length * 0.25))) {
  if (videos.length < 6) return { favorables: [], defavorables: [], n: 0 };

  const sorted = [...videos].sort((a, b) => b.rythme - a.rythme);
  const top = sorted.slice(0, n);
  const flop = sorted.slice(-n);

  const freq = (list) => {
    const m = new Map();
    list.forEach((v) => {
      new Set(tokenize(v.title, TITLE_STOPWORDS)).forEach((w) => m.set(w, (m.get(w) || 0) + 1));
    });
    return m;
  };

  const topFreq = freq(top);
  const flopFreq = freq(flop);
  const words = new Set([...topFreq.keys(), ...flopFreq.keys()]);

  const signals = [...words]
    .map((word) => {
      const t = topFreq.get(word) || 0;
      const f = flopFreq.get(word) || 0;
      return { word, top: t, flop: f, diff: t / top.length - f / flop.length };
    })
    .filter((s) => s.top + s.flop >= 2);

  const favorables = signals
    .filter((s) => s.diff > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 8);
  const defavorables = signals
    .filter((s) => s.diff < 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 8);

  return { favorables, defavorables, n };
}
