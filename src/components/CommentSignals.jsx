import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";

export default function CommentSignals({ data }) {
  if (!data) return null;

  return (
    <div className="mt-8">
      <Eyebrow>
        Ce que dit l'audience · {data.commentsAnalysed} commentaires sur {data.videosAnalysed} vidéos (top + flop)
      </Eyebrow>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: "0.1em" }} className="uppercase mb-2">
            Mots les plus fréquents
          </div>
          {data.topWords.length === 0 && <div style={{ color: C.muted, fontSize: 12 }}>Pas de mot récurrent.</div>}
          <div className="flex flex-wrap gap-2">
            {data.topWords.map((w) => (
              <span
                key={w.word}
                style={{
                  border: `1px solid ${C.line}`,
                  borderRadius: 6,
                  fontFamily: MONO,
                  fontSize: 11,
                  color: C.ink,
                }}
                className="px-2 py-1"
              >
                {w.word} <span style={{ color: C.muted }}>×{w.n}</span>
              </span>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: "0.1em" }} className="uppercase mb-2">
            Questions qui reviennent
          </div>
          {data.sampleQuestions.length === 0 && (
            <div style={{ color: C.muted, fontSize: 12 }}>Aucune question repérée dans l'échantillon.</div>
          )}
          {data.sampleQuestions.map((q, i) => (
            <div
              key={i}
              style={{ borderBottom: `1px solid ${C.line}`, fontSize: 12 }}
              className="py-1.5 leading-snug"
            >
              {q}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
