import { useEffect, useState } from "react";
import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";
import { compact } from "../lib/format";

const MAX_BARS = 300;

export default function RhythmStrip({ videos, medRythme }) {
  const [sel, setSel] = useState(null);
  const [filled, setFilled] = useState(false);
  // videos est trié du plus récent au plus ancien : on garde les MAX_BARS plus récentes pour la lisibilité,
  // les statistiques ailleurs dans l'app restent, elles, calculées sur l'intégralité des vidéos.
  const displayed = videos.length > MAX_BARS ? videos.slice(0, MAX_BARS) : videos;
  const strip = [...displayed].reverse();
  const maxR = Math.max(...displayed.map((v) => v.rythme), 1);
  const shown = sel != null ? strip[sel] : null;

  // Les barres montent depuis 0 au montage plutôt que d'apparaître déjà à leur hauteur finale.
  useEffect(() => {
    setFilled(false);
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setFilled(true)));
    return () => cancelAnimationFrame(t);
  }, [videos]);

  return (
    <div className="mt-8">
      <Eyebrow>
        Rythme des {videos.length} vidéos analysées · vues par jour
        {videos.length > MAX_BARS && ` (les ${MAX_BARS} plus récentes affichées ici)`}
      </Eyebrow>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10 }} className="p-3">
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
              aria-label={`${v.title} — ${compact(v.views)} vues`}
              style={{
                flex: 1,
                minWidth: 2,
                height: filled ? `${Math.max(2, (v.rythme / maxR) * 100)}%` : 0,
                background: sel === i ? C.ink : v.rythme >= medRythme ? C.signal : C.muted,
                opacity: sel === i ? 1 : v.rythme >= medRythme ? 1 : 0.5,
                transition: "height 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s, opacity 0.15s",
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
              {compact(shown.views)} vues · {compact(shown.rythme)}/jour · {Math.floor(shown.sec / 60)} min
            </span>
            <div style={{ color: C.muted }} className="mt-0.5">
              {shown.title}
            </div>
          </div>
        ) : (
          <div style={{ color: C.muted, fontSize: 12 }}>
            Chaque barre est une vidéo, de la plus ancienne à la plus récente. Touche une barre pour la lire.
            En orange : au-dessus de la médiane de la chaîne.
          </div>
        )}
      </div>
    </div>
  );
}
