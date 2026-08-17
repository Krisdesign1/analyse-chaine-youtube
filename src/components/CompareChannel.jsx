import { useState } from "react";
import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";

export default function CompareChannel({ onRun, busy, step, err, resB, onClear }) {
  const [link, setLink] = useState("");

  return (
    <div style={{ borderTop: `1px solid ${C.line}` }} className="mt-6 pt-4">
      <Eyebrow>Comparer avec une autre chaîne</Eyebrow>
      {resB ? (
        <div className="flex items-center justify-between gap-2">
          <span style={{ fontSize: 12 }}>{resB.channel.title}</span>
          <button onClick={onClear} style={{ color: C.muted, fontSize: 11, fontFamily: MONO }} className="underline">
            retirer
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && link.trim() && onRun(link)}
              placeholder="https://www.youtube.com/@concurrent"
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
              onClick={() => onRun(link)}
              disabled={busy || !link.trim()}
              style={{ border: `1px solid ${C.line}`, borderRadius: 6, fontFamily: MONO, fontSize: 11 }}
              className="px-3 uppercase disabled:opacity-50"
            >
              {busy ? "…" : "Comparer"}
            </button>
          </div>
          {busy && step && (
            <div style={{ color: C.signal, fontSize: 11, fontFamily: MONO }} className="mt-2">
              {step}
            </div>
          )}
          {err && (
            <div style={{ color: C.warn, fontSize: 11 }} className="mt-2 leading-relaxed">
              {err}
            </div>
          )}
        </>
      )}
    </div>
  );
}
