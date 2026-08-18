import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";
import { QUOTA_DAILY_LIMIT } from "../lib/quota";

export default function QuotaMeter({ used }) {
  const pct = Math.min(100, (used / QUOTA_DAILY_LIMIT) * 100);
  const tone = pct >= 80 ? C.warn : pct >= 50 ? C.signal : C.muted;

  return (
    <div style={{ borderTop: `1px solid ${C.line}` }} className="mt-6 pt-4">
      <Eyebrow>Quota estimé aujourd'hui</Eyebrow>
      <div className="flex items-center gap-2 mb-1">
        <div style={{ background: C.line, height: 6, borderRadius: 3, flex: 1, overflow: "hidden" }}>
          <div style={{ background: tone, height: 6, width: `${pct}%` }} />
        </div>
        <span style={{ fontFamily: MONO, fontSize: 11, color: tone, whiteSpace: "nowrap" }}>
          {used.toLocaleString("fr-FR")} / {QUOTA_DAILY_LIMIT.toLocaleString("fr-FR")}
        </span>
      </div>
      <div style={{ color: C.muted, fontSize: 11 }} className="leading-relaxed">
        Estimation approximative, remise à zéro à minuit local (le vrai quota Google se remet à
        zéro à 9 h heure de Kinshasa). Les scripts sont de loin les plus coûteux — 50 à 250 unités
        par vidéo.
      </div>
    </div>
  );
}
