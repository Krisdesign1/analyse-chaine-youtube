import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";
import { QUOTA_DAILY_LIMIT, SEARCH_DAILY_LIMIT } from "../lib/quota";

function Bar({ value, max }) {
  const pct = Math.min(100, (value / max) * 100);
  const tone = pct >= 80 ? C.warn : pct >= 50 ? C.signal : C.muted;
  return (
    <div className="flex items-center gap-2">
      <div style={{ background: C.line, height: 6, borderRadius: 3, flex: 1, overflow: "hidden" }}>
        <div style={{ background: tone, height: 6, width: `${pct}%` }} />
      </div>
      <span style={{ fontFamily: MONO, fontSize: 11, color: tone, whiteSpace: "nowrap" }}>
        {value.toLocaleString("fr-FR")} / {max.toLocaleString("fr-FR")}
      </span>
    </div>
  );
}

export default function QuotaMeter({ used, searchCalls }) {
  return (
    <div style={{ borderTop: `1px solid ${C.line}` }} className="mt-6 pt-4">
      <Eyebrow>Quota estimé aujourd'hui</Eyebrow>
      <div className="flex flex-col gap-2 mb-1">
        <Bar value={used} max={QUOTA_DAILY_LIMIT} />
        {searchCalls > 0 && (
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted }} className="mb-0.5">
              recherches de tendances (panier séparé)
            </div>
            <Bar value={searchCalls} max={SEARCH_DAILY_LIMIT} />
          </div>
        )}
      </div>
      <div style={{ color: C.muted, fontSize: 11 }} className="leading-relaxed mt-1">
        Estimation approximative, remise à zéro à minuit local (le vrai quota Google se remet à
        zéro à 9 h heure de Kinshasa). Les scripts sont de loin les plus coûteux — jusqu'à 250
        unités par vidéo, à charger manuellement dans la section "Scripts".
      </div>
    </div>
  );
}
