import { C, MONO } from "../theme";

export default function SearchBar({ link, setLink, onRun, busy, history, onChangeKey }) {
  return (
    <div className="mt-6">
      <div className="flex gap-2">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onRun()}
          placeholder="https://www.youtube.com/@lachaine"
          style={{
            background: "#fff",
            color: C.onLight,
            border: `1px solid ${C.line}`,
            borderRadius: 6,
            fontFamily: MONO,
            fontSize: 13,
          }}
          className="flex-1 px-3 py-3 outline-none"
        />
        <button
          onClick={() => onRun()}
          disabled={busy || !link.trim()}
          style={{
            background: busy ? C.muted : C.signal,
            color: "#fff",
            borderRadius: 6,
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: "0.1em",
          }}
          className="px-5 uppercase disabled:opacity-50"
        >
          {busy ? "…" : "Analyser"}
        </button>
      </div>
      {history.length > 0 && !busy && (
        <div className="flex flex-wrap gap-2 mt-3">
          {history.map((h) => (
            <button
              key={h.url}
              onClick={() => onRun(h.url)}
              style={{ border: `1px solid ${C.line}`, color: C.muted, borderRadius: 6, fontSize: 11, fontFamily: MONO }}
              className="px-2 py-1"
            >
              {h.title}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={onChangeKey}
        style={{ color: C.muted, fontSize: 11, fontFamily: MONO }}
        className="mt-2 underline"
      >
        changer de clé
      </button>
    </div>
  );
}
