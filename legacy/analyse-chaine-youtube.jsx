import React, { useState, useEffect, useRef } from "react";

/* ── Palette : console de régie, encre sur papier froid ────────────── */
const C = {
  paper: "#E6E5E1",
  panel: "#F6F5F2",
  ink: "#17171C",
  muted: "#71707A",
  line: "#CDCBC5",
  signal: "#4B2EE0",
  warn: "#B23A10",
  good: "#1C6B48",
};

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const SANS = 'ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif';

/* ── Utilitaires ───────────────────────────────────────────────────── */
const nf = new Intl.NumberFormat("fr-FR");
const fmt = (n) => (n == null ? "—" : nf.format(Math.round(n)));
const compact = (n) => {
  if (n == null) return "—";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + " M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(".", ",") + " k";
  return nf.format(Math.round(n));
};
const median = (a) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const parseDuration = (iso) => {
  const m = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "");
  if (!m) return 0;
  return (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0);
};
const ageDays = (d) => Math.max(1, (Date.now() - new Date(d).getTime()) / 86400000);
const dayName = (d) =>
  ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"][new Date(d).getDay()];

/* ── Extraction de l'identifiant depuis un lien ────────────────────── */
function readLink(raw) {
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

const API = "https://www.googleapis.com/youtube/v3";

async function call(path, params, key) {
  const q = new URLSearchParams({ ...params, key }).toString();
  const r = await fetch(`${API}/${path}?${q}`);
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
async function analyse(link, key, say) {
  const ref = readLink(link);
  if (!ref) throw new Error("Colle un lien de chaîne pour lancer l'analyse.");

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

  say("Lecture des dernières vidéos…");
  let ids = [];
  let page;
  for (let i = 0; i < 2; i++) {
    const p = await call(
      "playlistItems",
      { part: "contentDetails", playlistId: uploads, maxResults: "50", ...(page ? { pageToken: page } : {}) },
      key
    );
    ids.push(...p.items.map((x) => x.contentDetails.videoId));
    page = p.nextPageToken;
    if (!page) break;
  }
  if (!ids.length) throw new Error("Aucune vidéo publique sur cette chaîne.");

  say("Calcul des indicateurs…");
  const vids = [];
  for (let i = 0; i < ids.length; i += 50) {
    const v = await call(
      "videos",
      { part: "snippet,statistics,contentDetails", id: ids.slice(i, i + 50).join(",") },
      key
    );
    vids.push(...v.items);
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
      parFormat,
      jours,
      top: [...videos].sort((a, b) => b.rythme - a.rythme).slice(0, 5),
      flop: [...videos].sort((a, b) => a.rythme - b.rythme).slice(0, 5),
    },
  };
}

/* ── Directives calculées localement à partir des chiffres (gratuit, pas d'API tierce) ── */
function directives(r) {
  const s = r.stats;
  const out = [];

  const formats = s.parFormat.filter((f) => f.n > 0).sort((a, b) => b.med - a.med);
  if (formats.length >= 2) {
    const best = formats[0];
    const worst = formats[formats.length - 1];
    if (best.med > worst.med * 1.2) {
      out.push({
        titre: `Miser sur le format ${best.format}`,
        constat: `${best.format} fait ${compact(best.med)} vues/j (${best.n} vidéos) contre ${compact(worst.med)}/j pour ${worst.format}.`,
        action: `Augmenter la part de ${best.format} dans le calendrier de publication au détriment de ${worst.format}.`,
        priorite: best.med > worst.med * 2 ? "haute" : "moyenne",
      });
    }
  }

  const jours = s.jours.filter((j) => j.n > 0);
  if (jours.length >= 2) {
    const best = jours[0];
    const worst = jours[jours.length - 1];
    if (best.med > worst.med * 1.15) {
      out.push({
        titre: `Publier le ${best.jour}`,
        constat: `Le ${best.jour} atteint une médiane de ${compact(best.med)} vues/j (${best.n} vidéos), contre ${compact(worst.med)}/j le ${worst.jour}.`,
        action: `Caler les prochaines sorties sur ${best.jour} en priorité.`,
        priorite: "moyenne",
      });
    }
  }

  if (s.portee < 50) {
    out.push({
      titre: "Portée sous les abonnés",
      constat: `Vues médianes ${compact(s.medViews)} pour ${compact(r.channel.subs)} abonnés, soit ${s.portee.toFixed(0)} % de portée.`,
      action: "Retravailler miniatures et titres : la chaîne ne dépasse pas sa base d'abonnés actuels.",
      priorite: s.portee < 30 ? "haute" : "moyenne",
    });
  } else if (s.portee >= 150) {
    out.push({
      titre: "Bonne portée hors abonnés",
      constat: `Portée à ${s.portee.toFixed(0)} % : les vidéos touchent bien au-delà des abonnés.`,
      action: "Capitaliser en publiant plus souvent tant que l'algorithme pousse la chaîne.",
      priorite: "basse",
    });
  }

  if (s.tendance != null) {
    if (s.tendance <= -15) {
      out.push({
        titre: "Rythme en baisse",
        constat: `Les 10 dernières vidéos font ${s.tendance.toFixed(0)} % de vues/j de moins que les 10 précédentes, à âge égal.`,
        action: "Comparer ce qui a changé récemment (format, cadence, miniatures) avec la période précédente, plus performante.",
        priorite: "haute",
      });
    } else if (s.tendance >= 15) {
      out.push({
        titre: "Dynamique en hausse",
        constat: `+${s.tendance.toFixed(0)} % de vues/j sur les 10 dernières vidéos vs les 10 précédentes.`,
        action: "Reproduire ce qui a changé récemment et accélérer la cadence tant que la dynamique est favorable.",
        priorite: "moyenne",
      });
    }
  }

  if (s.engagement < 1.5) {
    out.push({
      titre: "Engagement faible",
      constat: `${s.engagement.toFixed(2)} % de likes+commentaires rapportés aux vues : l'audience regarde sans réagir.`,
      action: "Ajouter un appel à commenter en fin de vidéo et répondre aux premiers commentaires pour lancer la discussion.",
      priorite: "moyenne",
    });
  } else if (s.engagement >= 4) {
    out.push({
      titre: "Communauté engagée",
      constat: `${s.engagement.toFixed(2)} % d'engagement, nettement au-dessus de la moyenne.`,
      action: "Exploiter cette base via l'onglet communauté ou des formats participatifs (Q&A, sondages).",
      priorite: "basse",
    });
  }

  if (s.cadence > 10) {
    out.push({
      titre: "Cadence irrégulière",
      constat: `Écart médian de ${s.cadence.toFixed(1)} jours entre deux vidéos.`,
      action: "Resserrer le calendrier de publication : l'algorithme favorise la régularité pour recommander une chaîne.",
      priorite: "moyenne",
    });
  }

  if (s.top.length && s.flop.length) {
    const avg = (arr) => arr.reduce((a, v) => a + v.sec, 0) / arr.length;
    const topSec = avg(s.top);
    const flopSec = avg(s.flop);
    if (Math.abs(topSec - flopSec) > 60) {
      const courtGagne = topSec < flopSec;
      out.push({
        titre: courtGagne ? "Le court fonctionne mieux" : "Le long fonctionne mieux",
        constat: `Durée moyenne ${Math.round(topSec / 60)} min sur le top 5 contre ${Math.round(flopSec / 60)} min sur le flop 5.`,
        action: courtGagne
          ? "Resserrer le montage et viser des formats plus courts sur les prochains sujets."
          : "Ne pas hésiter à développer davantage les sujets qui le méritent.",
        priorite: "basse",
      });
    }
  }

  if (!out.length) {
    out.push({
      titre: "Chaîne équilibrée",
      constat: `Portée ${s.portee.toFixed(0)} %, engagement ${s.engagement.toFixed(2)} %, cadence ${s.cadence.toFixed(1)} j.`,
      action: "Pas de signal fort dans un sens ou l'autre : continuer sur la même ligne et surveiller l'évolution.",
      priorite: "basse",
    });
  }

  return out.slice(0, 6);
}

/* ── Petits composants ─────────────────────────────────────────────── */
const Eyebrow = ({ children }) => (
  <div
    style={{ fontFamily: MONO, color: C.muted, letterSpacing: "0.18em", fontSize: 10 }}
    className="uppercase mb-3"
  >
    {children}
  </div>
);

const Metric = ({ label, value, note, tone }) => (
  <div style={{ borderTop: `1px solid ${C.line}` }} className="pt-3">
    <div style={{ fontFamily: MONO, color: C.muted, fontSize: 10, letterSpacing: "0.14em" }} className="uppercase">
      {label}
    </div>
    <div style={{ fontFamily: MONO, color: tone || C.ink, fontSize: 26, lineHeight: 1.15 }} className="mt-1">
      {value}
    </div>
    {note && (
      <div style={{ color: C.muted, fontSize: 12 }} className="mt-1 leading-snug">
        {note}
      </div>
    )}
  </div>
);

/* ── Application ───────────────────────────────────────────────────── */
export default function AnalyseChaine() {
  const [key, setKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [link, setLink] = useState("");
  const [step, setStep] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState(null);
  const [tips, setTips] = useState(null);
  const [tipsErr, setTipsErr] = useState("");
  const [sel, setSel] = useState(null);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const k = localStorage.getItem("yt:key");
      if (k) {
        setKey(k);
        setKeySaved(true);
      }
    } catch (e) {}
    try {
      const h = localStorage.getItem("yt:history");
      if (h) setHistory(JSON.parse(h));
    } catch (e) {}
  }, []);

  const saveKey = () => {
    try {
      localStorage.setItem("yt:key", key.trim());
      setKeySaved(true);
    } catch (e) {
      setErr("La clé n'a pas pu être enregistrée. Elle marchera quand même pour cette session.");
      setKeySaved(true);
    }
  };

  const run = async (url) => {
    const target = url || link;
    if (!target.trim() || busy) return;
    setBusy(true);
    setErr("");
    setRes(null);
    setTips(null);
    setTipsErr("");
    setSel(null);
    try {
      const r = await analyse(target, key.trim(), setStep);
      setRes(r);
      const next = [
        { title: r.channel.title, url: "https://www.youtube.com/channel/" + r.channel.id },
        ...history.filter((h) => h.title !== r.channel.title),
      ].slice(0, 6);
      setHistory(next);
      try {
        localStorage.setItem("yt:history", JSON.stringify(next));
      } catch (e) {}
      try {
        setTips(directives(r));
      } catch (e) {
        setTipsErr("Les directives n'ont pas pu être générées. Les chiffres ci-dessus restent valables.");
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
      setStep("");
    }
  };

  const s = res?.stats;
  const maxR = res ? Math.max(...res.videos.map((v) => v.rythme), 1) : 1;
  const strip = res ? [...res.videos].reverse() : [];
  const shown = sel != null ? strip[sel] : null;

  return (
    <div style={{ background: C.paper, color: C.ink, fontFamily: SANS, minHeight: "100%" }} className="w-full">
      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* En-tête */}
        <div style={{ borderBottom: `2px solid ${C.ink}` }} className="pb-4">
          <Eyebrow>Régie · analyse de chaîne</Eyebrow>
          <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
            Colle un lien.<br />Lis le rythme.
          </h1>
          <p style={{ color: C.muted, fontSize: 13 }} className="mt-3 leading-relaxed">
            Données publiques uniquement : vues, likes, commentaires, durées, dates. La rétention, le CTR et les
            revenus ne sortent que du compte propriétaire de la chaîne.
          </p>
        </div>

        {/* Clé API */}
        {!keySaved ? (
          <div style={{ background: C.panel, border: `1px solid ${C.line}` }} className="mt-6 p-4">
            <Eyebrow>Étape unique</Eyebrow>
            <p style={{ fontSize: 13 }} className="leading-relaxed mb-3">
              Crée une clé API YouTube Data v3 sur console.cloud.google.com (gratuit, 10 000 requêtes par jour), puis
              colle-la ici. Elle reste sur ton appareil.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIza…"
                style={{ background: "#fff", border: `1px solid ${C.line}`, fontFamily: MONO, fontSize: 13 }}
                className="flex-1 px-3 py-2 outline-none"
              />
              <button
                onClick={saveKey}
                disabled={!key.trim()}
                style={{ background: C.ink, color: C.panel, fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em" }}
                className="px-4 uppercase disabled:opacity-40"
              >
                Garder
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && run()}
                placeholder="https://www.youtube.com/@lachaine"
                style={{ background: "#fff", border: `1px solid ${C.line}`, fontFamily: MONO, fontSize: 13 }}
                className="flex-1 px-3 py-3 outline-none"
              />
              <button
                onClick={() => run()}
                disabled={busy || !link.trim()}
                style={{
                  background: busy ? C.muted : C.signal,
                  color: "#fff",
                  fontFamily: MONO,
                  fontSize: 12,
                  letterSpacing: "0.1em",
                }}
                className="px-5 uppercase disabled:opacity-50"
              >
                {busy ? "…" : "Analyser"}
              </button>
            </div>
            {history.length > 0 && !busy && (
              <div className="flex flex-wrap gap-2 mt-3">
                {history.map((h) => (
                  <button
                    key={h.url}
                    onClick={() => {
                      setLink(h.url);
                      run(h.url);
                    }}
                    style={{ border: `1px solid ${C.line}`, color: C.muted, fontSize: 11, fontFamily: MONO }}
                    className="px-2 py-1"
                  >
                    {h.title}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                setKeySaved(false);
                setKey("");
              }}
              style={{ color: C.muted, fontSize: 11, fontFamily: MONO }}
              className="mt-2 underline"
            >
              changer de clé
            </button>
          </div>
        )}

        {busy && (
          <div style={{ fontFamily: MONO, color: C.signal, fontSize: 12 }} className="mt-6">
            {step}
          </div>
        )}
        {err && (
          <div
            style={{ background: "#fff", borderLeft: `3px solid ${C.warn}`, color: C.warn, fontSize: 13 }}
            className="mt-6 p-3 leading-relaxed"
          >
            {err}
          </div>
        )}

        {res && (
          <>
            {/* Identité */}
            <div style={{ borderBottom: `1px solid ${C.line}` }} className="mt-10 pb-4 flex items-center gap-3">
              {res.channel.thumb && (
                <img src={res.channel.thumb} alt="" style={{ width: 44, height: 44 }} className="rounded-full" />
              )}
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>{res.channel.title}</div>
                <div style={{ fontFamily: MONO, color: C.muted, fontSize: 11 }}>
                  {compact(res.channel.subs)} abonnés · {fmt(res.channel.videoCount)} vidéos ·{" "}
                  {compact(res.channel.totalViews)} vues cumulées
                </div>
              </div>
            </div>

            {/* Signature : la bande du rythme */}
            <div className="mt-8">
              <Eyebrow>Rythme des {res.videos.length} dernières vidéos · vues par jour</Eyebrow>
              <div style={{ background: C.panel, border: `1px solid ${C.line}` }} className="p-3">
                <div className="flex gap-1 mb-1" style={{ opacity: 0.35 }}>
                  {strip.map((_, i) => (
                    <div key={i} style={{ flex: 1, height: 3, background: C.line }} />
                  ))}
                </div>
                <div className="flex items-end gap-1" style={{ height: 120 }}>
                  {strip.map((v, i) => (
                    <button
                      key={v.id}
                      onMouseEnter={() => setSel(i)}
                      onClick={() => setSel(i)}
                      title={v.title}
                      style={{
                        flex: 1,
                        minWidth: 2,
                        height: `${Math.max(2, (v.rythme / maxR) * 100)}%`,
                        background: sel === i ? C.ink : v.rythme >= s.medRythme ? C.signal : C.line,
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-1 mt-1" style={{ opacity: 0.35 }}>
                  {strip.map((_, i) => (
                    <div key={i} style={{ flex: 1, height: 3, background: C.line }} />
                  ))}
                </div>
              </div>
              <div style={{ minHeight: 46 }} className="mt-2">
                {shown ? (
                  <div style={{ fontSize: 12 }} className="leading-snug">
                    <span style={{ fontFamily: MONO, color: C.signal }}>
                      {compact(shown.views)} vues · {compact(shown.rythme)}/jour ·{" "}
                      {Math.floor(shown.sec / 60)} min
                    </span>
                    <div style={{ color: C.muted }} className="mt-0.5">
                      {shown.title}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: C.muted, fontSize: 12 }}>
                    Chaque barre est une vidéo, de la plus ancienne à la plus récente. Touche une barre pour la lire.
                    En violet : au-dessus de la médiane de la chaîne.
                  </div>
                )}
              </div>
            </div>

            {/* Indicateurs */}
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
              <Metric
                label="Portée vs abonnés"
                value={s.portee.toFixed(0) + " %"}
                note={`Vues médianes ${compact(s.medViews)} pour ${compact(res.channel.subs)} abonnés. Au-dessus de 100 %, l'algorithme pousse au-delà de la base.`}
                tone={s.portee >= 100 ? C.good : s.portee < 30 ? C.warn : C.ink}
              />
              <Metric
                label="Tendance récente"
                value={s.tendance == null ? "—" : (s.tendance > 0 ? "+" : "") + s.tendance.toFixed(0) + " %"}
                note="10 dernières vidéos comparées aux 10 précédentes, à âge égal."
                tone={s.tendance > 5 ? C.good : s.tendance < -15 ? C.warn : C.ink}
              />
              <Metric
                label="Cadence"
                value={s.cadence < 1 ? "plusieurs/jour" : s.cadence.toFixed(1) + " j"}
                note="Écart médian entre deux publications."
              />
              <Metric
                label="Engagement"
                value={s.engagement.toFixed(2) + " %"}
                note="Likes + commentaires rapportés aux vues. En dessous de 2 %, l'audience regarde sans réagir."
                tone={s.engagement >= 4 ? C.good : s.engagement < 1.5 ? C.warn : C.ink}
              />
            </div>

            {/* Formats et jours */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Eyebrow>Ce qui marche par format</Eyebrow>
                {s.parFormat
                  .filter((f) => f.n > 0)
                  .map((f) => (
                    <div
                      key={f.format}
                      style={{ borderBottom: `1px solid ${C.line}`, fontFamily: MONO, fontSize: 12 }}
                      className="flex justify-between py-2"
                    >
                      <span>
                        {f.format} <span style={{ color: C.muted }}>({f.n})</span>
                      </span>
                      <span style={{ color: f.med === Math.max(...s.parFormat.map((x) => x.med)) ? C.signal : C.ink }}>
                        {compact(f.med)}/j
                      </span>
                    </div>
                  ))}
              </div>
              <div>
                <Eyebrow>Meilleurs jours de sortie</Eyebrow>
                {s.jours.slice(0, 4).map((j) => (
                  <div
                    key={j.jour}
                    style={{ borderBottom: `1px solid ${C.line}`, fontFamily: MONO, fontSize: 12 }}
                    className="flex justify-between py-2"
                  >
                    <span>
                      {j.jour} <span style={{ color: C.muted }}>({j.n})</span>
                    </span>
                    <span>{compact(j.med)}/j</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Directives */}
            <div className="mt-10">
              <Eyebrow>Directives</Eyebrow>
              {!tips && !tipsErr && (
                <div style={{ fontFamily: MONO, color: C.signal, fontSize: 12 }}>Lecture des chiffres…</div>
              )}
              {tipsErr && <div style={{ color: C.warn, fontSize: 13 }}>{tipsErr}</div>}
              {tips &&
                tips.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      background: C.panel,
                      borderLeft: `3px solid ${
                        t.priorite === "haute" ? C.warn : t.priorite === "moyenne" ? C.signal : C.line
                      }`,
                    }}
                    className="p-4 mb-2"
                  >
                    <div className="flex items-baseline gap-2">
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{t.titre}</span>
                      <span
                        style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: C.muted }}
                        className="uppercase"
                      >
                        {t.priorite}
                      </span>
                    </div>
                    <div style={{ color: C.muted, fontSize: 12, fontFamily: MONO }} className="mt-1">
                      {t.constat}
                    </div>
                    <div style={{ fontSize: 13 }} className="mt-2 leading-relaxed">
                      {t.action}
                    </div>
                  </div>
                ))}
            </div>

            {/* Top / flop */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 pb-10">
              <div>
                <Eyebrow>Ce qui a percé</Eyebrow>
                {s.top.map((v) => (
                  <div key={v.id} style={{ borderBottom: `1px solid ${C.line}` }} className="py-2">
                    <div style={{ fontSize: 12 }} className="leading-snug">
                      {v.title}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: C.signal }}>
                      {compact(v.views)} vues · {compact(v.rythme)}/j
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <Eyebrow>Ce qui n'a pas pris</Eyebrow>
                {s.flop.map((v) => (
                  <div key={v.id} style={{ borderBottom: `1px solid ${C.line}` }} className="py-2">
                    <div style={{ fontSize: 12 }} className="leading-snug">
                      {v.title}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
                      {compact(v.views)} vues · {compact(v.rythme)}/j
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
