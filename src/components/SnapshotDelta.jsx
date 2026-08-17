import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";

const signed = (v, digits = 0) => (v == null ? "—" : (v > 0 ? "+" : "") + v.toFixed(digits));

export default function SnapshotDelta({ delta }) {
  if (!delta) return null;

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10 }} className="mt-6 p-3">
      <Eyebrow>
        Depuis ta dernière analyse ({delta.days === 0 ? "aujourd'hui" : `il y a ${delta.days} jour${delta.days > 1 ? "s" : ""}`})
      </Eyebrow>
      <div style={{ fontFamily: MONO, fontSize: 12 }} className="flex flex-wrap gap-x-5 gap-y-1">
        <span>Score {signed(delta.score)} pts</span>
        <span>Portée {signed(delta.portee)} pts</span>
        <span>Tendance {signed(delta.tendance)} pts</span>
        <span>Engagement {signed(delta.engagement, 2)} %</span>
        <span>Abonnés {signed(delta.subs)}</span>
      </div>
    </div>
  );
}
