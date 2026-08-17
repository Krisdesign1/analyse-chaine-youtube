import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";
import { compact } from "../lib/format";

export default function TrendResults({ query, results }) {
  if (!results) return null;

  return (
    <div className="mt-10 pb-10">
      <Eyebrow>Tendance pour "{query}" · {results.length} vidéos, triées par vues</Eyebrow>
      {results.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>Aucun résultat.</div>}
      <div className="flex flex-col gap-3">
        {results.map((v, i) => (
          <a
            key={v.id}
            href={`https://www.youtube.com/watch?v=${v.id}`}
            target="_blank"
            rel="noreferrer"
            style={{ borderBottom: `1px solid ${C.line}`, color: "inherit", textDecoration: "none" }}
            className="flex items-center gap-3 py-2"
          >
            <span style={{ fontFamily: MONO, color: C.muted, fontSize: 12, width: 20 }}>{i + 1}</span>
            {v.thumb && <img src={v.thumb} alt="" style={{ width: 64, height: 36, objectFit: "cover", borderRadius: 4 }} />}
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 13 }} className="leading-snug truncate">
                {v.title}
              </div>
              <div style={{ fontFamily: MONO, color: C.muted, fontSize: 11 }}>
                {v.channelTitle} · {new Date(v.publishedAt).toLocaleDateString("fr-FR")} ·{" "}
                {Math.floor(v.sec / 60)} min
              </div>
            </div>
            <div style={{ fontFamily: MONO, color: C.signal, fontSize: 13, whiteSpace: "nowrap" }}>
              {compact(v.views)} vues
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
