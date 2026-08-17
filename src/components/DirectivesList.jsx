import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";

export default function DirectivesList({ tips, tipsErr }) {
  return (
    <div className="mt-10">
      <Eyebrow>Directives</Eyebrow>
      {tipsErr && <div style={{ color: C.warn, fontSize: 13 }}>{tipsErr}</div>}
      {tips &&
        tips.map((t, i) => (
          <div
            key={i}
            style={{
              background: C.panel,
              borderLeft: `3px solid ${
                t.priorite === "haute" ? C.warn : t.priorite === "moyenne" ? C.signal : C.line
              }`,
              borderRadius: 6,
            }}
            className="p-4 mb-2"
          >
            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: 15, fontWeight: 700 }}>{t.titre}</span>
              <span
                style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: C.muted }}
                className="uppercase"
              >
                {t.priorite}
              </span>
            </div>
            <div style={{ color: C.muted, fontSize: 12, fontFamily: MONO }} className="mt-1">
              {t.constat}
            </div>
            <div style={{ fontSize: 13 }} className="mt-2 leading-relaxed">
              {t.action}
            </div>
          </div>
        ))}
    </div>
  );
}
