import { useState } from "react";
import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";

export default function KeyForm({ onSave }) {
  const [key, setKey] = useState("");

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10 }} className="mt-6 p-4">
      <Eyebrow>Étape unique</Eyebrow>
      <p style={{ fontSize: 13 }} className="leading-relaxed mb-3">
        Crée une clé API YouTube Data v3 sur console.cloud.google.com (gratuit, 10 000 requêtes par jour), puis
        colle-la ici. Elle reste sur ton appareil.
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && key.trim() && onSave(key)}
          placeholder="AIza…"
          style={{
            background: "#fff",
            color: C.onLight,
            border: `1px solid ${C.line}`,
            borderRadius: 6,
            fontFamily: MONO,
            fontSize: 13,
          }}
          className="flex-1 px-3 py-2 outline-none"
        />
        <button
          onClick={() => onSave(key)}
          disabled={!key.trim()}
          style={{
            background: C.ink,
            color: C.panel,
            borderRadius: 6,
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: "0.1em",
          }}
          className="px-4 uppercase disabled:opacity-40"
        >
          Garder
        </button>
      </div>
    </div>
  );
}
