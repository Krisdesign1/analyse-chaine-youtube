import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";
import { compact } from "../lib/format";

export default function HooksPanel({ hooks }) {
  if (!hooks || !hooks.length) return null;
  const top = hooks.filter((h) => h.group === "top");
  const flop = hooks.filter((h) => h.group === "flop");

  return (
    <div className="mt-8">
      <Eyebrow>Scripts (25 premières secondes) · ta chaîne uniquement</Eyebrow>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.signal, letterSpacing: "0.1em" }} className="uppercase mb-2">
            Vidéos qui percent
          </div>
          {top.map((h) => (
            <div key={h.id} style={{ borderBottom: `1px solid ${C.line}` }} className="py-2">
              <div style={{ fontSize: 12, fontWeight: 700 }}>{h.title}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted }} className="mb-1">
                {compact(h.rythme)} vues/j
              </div>
              <div style={{ fontSize: 12, color: C.muted }} className="leading-snug">
                {h.hook}
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: "0.1em" }} className="uppercase mb-2">
            Vidéos qui ne prennent pas
          </div>
          {flop.map((h) => (
            <div key={h.id} style={{ borderBottom: `1px solid ${C.line}` }} className="py-2">
              <div style={{ fontSize: 12, fontWeight: 700 }}>{h.title}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted }} className="mb-1">
                {compact(h.rythme)} vues/j
              </div>
              <div style={{ fontSize: 12, color: C.muted }} className="leading-snug">
                {h.hook}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
