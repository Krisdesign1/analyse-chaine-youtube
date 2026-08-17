import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";
import { compact } from "../lib/format";
import { healthScore } from "../lib/score";

const ROWS = [
  { key: "subs", label: "Abonnés", fmt: compact, get: (r) => r.channel.subs },
  { key: "medViews", label: "Vues médianes", fmt: compact, get: (r) => r.stats.medViews },
  { key: "portee", label: "Portée", fmt: (v) => v.toFixed(0) + " %", get: (r) => r.stats.portee },
  {
    key: "tendance",
    label: "Tendance",
    fmt: (v) => (v > 0 ? "+" : "") + v.toFixed(0) + " %",
    get: (r) => r.stats.tendance,
  },
  { key: "engagement", label: "Engagement", fmt: (v) => v.toFixed(2) + " %", get: (r) => r.stats.engagement },
  { key: "cadence", label: "Cadence", fmt: (v) => v.toFixed(1) + " j", get: (r) => r.stats.cadence, lowerBetter: true },
  {
    key: "regularite",
    label: "Régularité",
    fmt: (v) => v.toFixed(2),
    get: (r) => r.stats.regularite,
    lowerBetter: true,
  },
];

export default function CompareTable({ resA, resB }) {
  if (!resB) return null;
  const scoreA = healthScore(resA.stats);
  const scoreB = healthScore(resB.stats);

  return (
    <div className="mt-8">
      <Eyebrow>Comparaison</Eyebrow>
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }}>
              <th
                style={{ padding: "8px 10px", textAlign: "left", fontFamily: MONO, fontSize: 10, color: C.muted }}
                className="uppercase"
              >
                Indicateur
              </th>
              <th style={{ padding: "8px 10px", textAlign: "right", fontFamily: MONO, fontSize: 11 }}>
                {resA.channel.title}
              </th>
              <th style={{ padding: "8px 10px", textAlign: "right", fontFamily: MONO, fontSize: 11 }}>
                {resB.channel.title}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              <td
                style={{ padding: "8px 10px", fontFamily: MONO, fontSize: 11, color: C.muted }}
                className="uppercase"
              >
                Score de santé
              </td>
              <td
                style={{
                  padding: "8px 10px",
                  textAlign: "right",
                  fontFamily: MONO,
                  color: scoreA.total >= scoreB.total ? C.good : C.ink,
                }}
              >
                {scoreA.total}/100
              </td>
              <td
                style={{
                  padding: "8px 10px",
                  textAlign: "right",
                  fontFamily: MONO,
                  color: scoreB.total >= scoreA.total ? C.good : C.ink,
                }}
              >
                {scoreB.total}/100
              </td>
            </tr>
            {ROWS.map((row) => {
              const a = row.get(resA);
              const b = row.get(resB);
              const comparable = a != null && b != null;
              const aWins = comparable && (row.lowerBetter ? a <= b : a >= b);
              const bWins = comparable && (row.lowerBetter ? b <= a : b >= a);
              return (
                <tr key={row.key} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td
                    style={{ padding: "8px 10px", fontFamily: MONO, fontSize: 11, color: C.muted }}
                    className="uppercase"
                  >
                    {row.label}
                  </td>
                  <td
                    style={{ padding: "8px 10px", textAlign: "right", fontFamily: MONO, color: aWins ? C.good : C.ink }}
                  >
                    {a == null ? "—" : row.fmt(a)}
                  </td>
                  <td
                    style={{ padding: "8px 10px", textAlign: "right", fontFamily: MONO, color: bWins ? C.good : C.ink }}
                  >
                    {b == null ? "—" : row.fmt(b)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
