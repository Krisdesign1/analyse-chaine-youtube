import { useEffect, useState } from "react";
import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";
import { compact } from "../lib/format";

export default function TrendChart({ historique }) {
  const [sel, setSel] = useState(null);
  const [filled, setFilled] = useState(false);

  // Les hooks doivent s'exécuter avant le retour anticipé ci-dessous (règle des Hooks React).
  useEffect(() => {
    setFilled(false);
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setFilled(true)));
    return () => cancelAnimationFrame(t);
  }, [historique]);

  if (historique.length < 2) return null;

  const maxR = Math.max(...historique.map((h) => h.medRythme), 1);
  const shown = sel != null ? historique[sel] : null;

  return (
    <div className="mt-8">
      <Eyebrow>Évolution sur {historique.length} mois d'existence · vues/jour médianes par mois</Eyebrow>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10 }} className="p-3">
        <div className="flex items-end gap-1" style={{ height: 100 }}>
          {historique.map((h, i) => (
            <button
              key={h.mois}
              onMouseEnter={() => setSel(i)}
              onClick={() => setSel(i)}
              title={`${h.mois} · ${h.n} vidéo(s)`}
              style={{
                flex: 1,
                minWidth: 2,
                height: filled ? `${Math.max(2, (h.medRythme / maxR) * 100)}%` : 0,
                background: sel === i ? C.ink : C.signal,
                opacity: sel === i ? 1 : 0.55,
                transition: "height 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s, opacity 0.15s",
              }}
            />
          ))}
        </div>
      </div>
      <div style={{ minHeight: 32 }} className="mt-2">
        {shown ? (
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.signal }}>
            {shown.mois} · {shown.n} vidéo{shown.n > 1 ? "s" : ""} · {compact(shown.medRythme)} vues/j médianes ·{" "}
            {compact(shown.vues)} vues cumulées ce mois-là
          </div>
        ) : (
          <div style={{ color: C.muted, fontSize: 12 }}>
            Une barre par mois, sur toute l'histoire de la chaîne — pas seulement les vidéos récentes. Touche une
            barre pour le détail.
          </div>
        )}
      </div>
    </div>
  );
}
