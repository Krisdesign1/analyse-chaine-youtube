/* ── Tags qui reviennent plus souvent dans les vidéos qui percent que dans celles qui flop ──
   Gratuit et immédiat : les tags sont déjà présents dans la réponse `videos.list`
   (part=snippet), aucun appel API supplémentaire n'est nécessaire. */

export function tagSignals(videos, n = Math.max(5, Math.floor(videos.length * 0.25))) {
  const withTags = videos.filter((v) => v.tags && v.tags.length);
  if (withTags.length < 6) return { favorables: [], defavorables: [], n: 0, hasTags: withTags.length > 0 };

  const sorted = [...withTags].sort((a, b) => b.rythme - a.rythme);
  const top = sorted.slice(0, n);
  const flop = sorted.slice(-n);

  const freq = (list) => {
    const m = new Map();
    list.forEach((v) => {
      new Set(v.tags.map((t) => t.toLowerCase().trim())).forEach((t) => m.set(t, (m.get(t) || 0) + 1));
    });
    return m;
  };

  const topFreq = freq(top);
  const flopFreq = freq(flop);
  const tags = new Set([...topFreq.keys(), ...flopFreq.keys()]);

  const signals = [...tags]
    .map((tag) => {
      const t = topFreq.get(tag) || 0;
      const f = flopFreq.get(tag) || 0;
      return { tag, top: t, flop: f, diff: t / top.length - f / flop.length };
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

  return { favorables, defavorables, n, hasTags: true };
}
