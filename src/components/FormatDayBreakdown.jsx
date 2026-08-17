import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";
import { compact } from "../lib/format";

export default function FormatDayBreakdown({ stats }) {
  const s = stats;
  const activeFormats = s.parFormat.filter((f) => f.n > 0);
  const maxFormatMed = Math.max(...activeFormats.map((x) => x.med), 0);

  return (
    <div className="mt-8 grid grid-cols-2 gap-8">
      <div>
        <Eyebrow>Ce qui marche par format</Eyebrow>
        {activeFormats.map((f) => (
          <div
            key={f.format}
            style={{ borderBottom: `1px solid ${C.line}`, fontFamily: MONO, fontSize: 12 }}
            className="flex justify-between py-2"
          >
            <span>
              {f.format} <span style={{ color: C.muted }}>({f.n})</span>
            </span>
            <span style={{ color: f.med === maxFormatMed ? C.signal : C.ink }}>{compact(f.med)}/j</span>
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
  );
}
