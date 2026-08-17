import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";
import { compact } from "../lib/format";

export default function TopFlopLists({ stats }) {
  const s = stats;
  return (
    <div className="mt-8 grid grid-cols-2 gap-8 pb-10">
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
  );
}
