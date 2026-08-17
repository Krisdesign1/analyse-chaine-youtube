import { C, MONO } from "../theme";

export default function Metric({ label, value, note, tone }) {
  return (
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
}
