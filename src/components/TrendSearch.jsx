import { useState } from "react";
import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";

export default function TrendSearch({ onRun, busy, err, hasResults, onClear }) {
  const [query, setQuery] = useState("");

  return (
    <div style={{ borderTop: `1px solid ${C.line}` }} className="mt-6 pt-4">
      <Eyebrow>Recherche de tendances</Eyebrow>
      <p style={{ fontSize: 12, color: C.muted }} className="leading-relaxed mb-3">
        Cherche les vidéos les plus vues sur tout YouTube pour un mot-clé. Coûte 1 unité par
        recherche, mais dans un panier séparé plafonné à 100 recherches par jour — à utiliser avec
        un peu de mesure malgré tout.
      </p>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && query.trim() && onRun(query)}
          placeholder="ex. montage vidéo débutant"
          style={{
            background: "#fff",
            color: C.onLight,
            border: `1px solid ${C.line}`,
            borderRadius: 6,
            fontFamily: MONO,
            fontSize: 12,
          }}
          className="flex-1 px-2 py-2 outline-none"
        />
        <button
          onClick={() => onRun(query)}
          disabled={busy || !query.trim()}
          style={{ border: `1px solid ${C.line}`, borderRadius: 6, fontFamily: MONO, fontSize: 11 }}
          className="px-3 uppercase disabled:opacity-50"
        >
          {busy ? "…" : "Chercher"}
        </button>
      </div>
      {hasResults && !busy && (
        <button onClick={onClear} style={{ color: C.muted, fontSize: 11, fontFamily: MONO }} className="mt-2 underline">
          effacer les résultats
        </button>
      )}
      {err && (
        <div style={{ color: C.warn, fontSize: 11 }} className="mt-2 leading-relaxed">
          {err}
        </div>
      )}
    </div>
  );
}
