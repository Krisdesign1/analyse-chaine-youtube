import { useEffect, useState } from "react";
import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";

export default function HealthScore({ score }) {
  const tone = score.total >= 60 ? C.good : score.total < 30 ? C.warn : C.ink;
  const [filled, setFilled] = useState(false);

  // Démarre les barres à 0 puis les anime vers leur valeur au montage, plutôt que de les
  // afficher déjà pleines — le score change à chaque analyse, ce mouvement l'annonce.
  useEffect(() => {
    setFilled(false);
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setFilled(true)));
    return () => cancelAnimationFrame(t);
  }, [score.total]);

  return (
    <div className="mt-8">
      <Eyebrow>Score de santé</Eyebrow>
      <div className="flex items-end gap-3 mb-3">
        <div style={{ fontFamily: MONO, fontSize: 48, fontWeight: 800, color: tone, lineHeight: 1 }}>
          {score.total}
        </div>
        <div style={{ fontSize: 14, color: C.muted }} className="pb-1">
          / 100 · {score.label}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {score.breakdown.map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted, width: 90 }} className="uppercase">
              {b.label}
            </span>
            <div style={{ background: C.line, height: 6, borderRadius: 3, flex: 1, overflow: "hidden" }}>
              <div
                style={{
                  background: C.signal,
                  height: 6,
                  width: filled ? `${(b.pts / b.max) * 100}%` : 0,
                  transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted, width: 40, textAlign: "right" }}>
              {b.pts}/{b.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
