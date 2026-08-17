export const nf = new Intl.NumberFormat("fr-FR");

export const fmt = (n) => (n == null ? "—" : nf.format(Math.round(n)));

export const compact = (n) => {
  if (n == null) return "—";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + " M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(".", ",") + " k";
  return nf.format(Math.round(n));
};

export const median = (a) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export const parseDuration = (iso) => {
  const m = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "");
  if (!m) return 0;
  return (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0);
};

export const ageDays = (d) => Math.max(1, (Date.now() - new Date(d).getTime()) / 86400000);

export const dayName = (d) =>
  ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"][new Date(d).getDay()];

export const toCSV = (videos) => {
  const header = ["date", "titre", "vues", "likes", "commentaires", "duree_sec", "format", "vues_par_jour"];
  const rows = videos.map((v) => [
    v.date,
    `"${v.title.replace(/"/g, '""')}"`,
    v.views,
    v.likes,
    v.comments,
    v.sec,
    v.format,
    Math.round(v.rythme),
  ]);
  return [header, ...rows].map((r) => r.join(",")).join("\n");
};
