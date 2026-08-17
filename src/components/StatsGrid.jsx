import { C } from "../theme";
import Metric from "./Metric";
import { compact } from "../lib/format";

export default function StatsGrid({ stats, channel }) {
  const s = stats;
  return (
    <div className="mt-8 grid grid-cols-4 gap-x-6 gap-y-5">
      <Metric
        label="Portée vs abonnés"
        value={s.portee.toFixed(0) + " %"}
        note={`Vues médianes ${compact(s.medViews)} pour ${compact(channel.subs)} abonnés. Au-dessus de 100 %, l'algorithme pousse au-delà de la base.`}
        tone={s.portee >= 100 ? C.good : s.portee < 30 ? C.warn : C.ink}
      />
      <Metric
        label="Tendance récente"
        value={s.tendance == null ? "—" : (s.tendance > 0 ? "+" : "") + s.tendance.toFixed(0) + " %"}
        note="10 dernières vidéos comparées aux 10 précédentes, à âge égal."
        tone={s.tendance > 5 ? C.good : s.tendance < -15 ? C.warn : C.ink}
      />
      <Metric
        label="Cadence"
        value={s.cadence < 1 ? "plusieurs/jour" : s.cadence.toFixed(1) + " j"}
        note="Écart médian entre deux publications."
      />
      <Metric
        label="Engagement"
        value={s.engagement.toFixed(2) + " %"}
        note="Likes + commentaires rapportés aux vues. En dessous de 2 %, l'audience regarde sans réagir."
        tone={s.engagement >= 4 ? C.good : s.engagement < 1.5 ? C.warn : C.ink}
      />
    </div>
  );
}
