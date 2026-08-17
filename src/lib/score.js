/* ── Score de santé global : synthétise les indicateurs en un seul chiffre 0-100 ── */

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (v, lo, hi, ptsMax) => clamp(((v - lo) / (hi - lo)) * ptsMax, 0, ptsMax);

export function healthScore(stats) {
  const portee = lerp(stats.portee, 0, 150, 25);
  const tendance = stats.tendance == null ? 10 : lerp(stats.tendance, -30, 15, 20);
  const engagement = lerp(stats.engagement, 0, 5, 20);
  const regularite = lerp(2 - stats.regularite, 0, 2, 15);
  const cadence = lerp(30 - stats.cadence, 0, 27, 20);

  const breakdown = [
    { label: "Portée", pts: Math.round(portee), max: 25 },
    { label: "Tendance", pts: Math.round(tendance), max: 20 },
    { label: "Engagement", pts: Math.round(engagement), max: 20 },
    { label: "Régularité", pts: Math.round(regularite), max: 15 },
    { label: "Cadence", pts: Math.round(cadence), max: 20 },
  ];
  const total = breakdown.reduce((s, b) => s + b.pts, 0);
  const label =
    total >= 80 ? "Excellente" : total >= 60 ? "Bonne" : total >= 40 ? "Moyenne" : total >= 20 ? "Fragile" : "Critique";

  return { total, label, breakdown };
}
