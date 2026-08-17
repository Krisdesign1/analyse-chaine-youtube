import { useState } from "react";
import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";

export default function ConnectChannel({ clientIdSaved, onSaveClientId, oauthReady, connected, connecting, connectErr, onConnect, onDisconnect }) {
  const [clientId, setClientId] = useState("");

  return (
    <div style={{ borderTop: `1px solid ${C.line}` }} className="mt-6 pt-4">
      <Eyebrow>Revenus · rétention</Eyebrow>

      {!clientIdSaved ? (
        <>
          <p style={{ fontSize: 12, color: C.muted }} className="leading-relaxed mb-3">
            Optionnel, et uniquement pour ta propre chaîne. Crée un ID client OAuth (gratuit) sur
            console.cloud.google.com → Identifiants → Créer des identifiants → ID client OAuth → Application Web,
            puis colle-le ici.
          </p>
          <div className="flex gap-2">
            <input
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && clientId.trim() && onSaveClientId(clientId)}
              placeholder="xxxx.apps.googleusercontent.com"
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
              onClick={() => onSaveClientId(clientId)}
              disabled={!clientId.trim()}
              style={{ background: C.ink, color: C.panel, borderRadius: 6, fontFamily: MONO, fontSize: 11 }}
              className="px-3 uppercase disabled:opacity-40"
            >
              Garder
            </button>
          </div>
        </>
      ) : connected ? (
        <div className="flex items-center justify-between gap-2">
          <div style={{ fontSize: 12 }} className="flex items-center gap-2">
            {connected.thumb && (
              <img src={connected.thumb} alt="" style={{ width: 22, height: 22 }} className="rounded-full" />
            )}
            <span>{connected.title}</span>
          </div>
          <button onClick={onDisconnect} style={{ color: C.muted, fontSize: 11, fontFamily: MONO }} className="underline">
            déconnecter
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={onConnect}
            disabled={connecting || !oauthReady}
            style={{ border: `1px solid ${C.line}`, borderRadius: 6, fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em" }}
            className="px-3 py-2 uppercase w-full disabled:opacity-50"
          >
            {connecting ? "Connexion…" : oauthReady ? "Connecter ma chaîne avec Google" : "Initialisation…"}
          </button>
          {connectErr && (
            <div style={{ color: C.warn, fontSize: 11 }} className="mt-2 leading-relaxed">
              {connectErr}
            </div>
          )}
        </>
      )}
    </div>
  );
}
