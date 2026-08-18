import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";

export default function TrackedChannels({ channels, onSelect }) {
  if (!channels.length) return null;

  return (
    <div className="w-full" style={{ maxWidth: 640 }}>
      <Eyebrow>Chaînes suivies ({channels.length})</Eyebrow>
      <div className="flex flex-col gap-2">
        {channels.map((c) => (
          <button
            key={c.channelId}
            onClick={() => onSelect(c.channelId)}
            style={{ border: `1px solid ${C.line}`, borderRadius: 8, textAlign: "left" }}
            className="p-3 flex items-center justify-between gap-4 w-full"
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{c.title}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
                {c.count} analyse{c.count > 1 ? "s" : ""} · dernière le{" "}
                {new Date(c.last.date).toLocaleDateString("fr-FR")}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 800, color: C.signal }}>{c.last.score}</div>
              {c.scoreDelta != null && (
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: c.scoreDelta >= 0 ? C.good : C.warn,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.scoreDelta >= 0 ? "+" : ""}
                  {c.scoreDelta}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
