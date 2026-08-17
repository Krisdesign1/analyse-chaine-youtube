import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";

export default function KeywordSignals({ data }) {
  if (!data || (!data.favorables.length && !data.defavorables.length)) return null;

  return (
    <div className="mt-8 grid grid-cols-2 gap-8">
      <div>
        <Eyebrow>Mots favorables dans les titres (groupes de {data.n})</Eyebrow>
        {data.favorables.length === 0 && <div style={{ color: C.muted, fontSize: 12 }}>Pas de signal net.</div>}
        {data.favorables.map((s) => (
          <div
            key={s.word}
            style={{ borderBottom: `1px solid ${C.line}`, fontFamily: MONO, fontSize: 12 }}
            className="flex justify-between py-1.5"
          >
            <span>{s.word}</span>
            <span style={{ color: C.signal }}>
              {s.top}/{data.n} vs {s.flop}/{data.n}
            </span>
          </div>
        ))}
      </div>
      <div>
        <Eyebrow>Mots défavorables dans les titres (groupes de {data.n})</Eyebrow>
        {data.defavorables.length === 0 && <div style={{ color: C.muted, fontSize: 12 }}>Pas de signal net.</div>}
        {data.defavorables.map((s) => (
          <div
            key={s.word}
            style={{ borderBottom: `1px solid ${C.line}`, fontFamily: MONO, fontSize: 12 }}
            className="flex justify-between py-1.5"
          >
            <span>{s.word}</span>
            <span style={{ color: C.muted }}>
              {s.top}/{data.n} vs {s.flop}/{data.n}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
