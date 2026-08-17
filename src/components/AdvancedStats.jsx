import { C } from "../theme";
import Eyebrow from "./Eyebrow";
import Metric from "./Metric";

export default function AdvancedStats({ stats }) {
  const s = stats;
  return (
    <div className="mt-8">
      <Eyebrow>Signaux avancés</Eyebrow>
      <div className="grid grid-cols-4 gap-x-6 gap-y-5">
        <Metric
          label="Régularité"
          value={s.regularite < 0.6 ? "Stable" : s.regularite < 1.2 ? "Variable" : "Imprévisible"}
          note={`Écart interquartile à ${s.regularite.toFixed(2)}× la médiane du rythme — plus bas = performance plus reproductible d'une vidéo à l'autre.`}
          tone={s.regularite < 0.6 ? C.good : s.regularite >= 1.2 ? C.warn : C.ink}
        />
        <Metric label="Taux de likes" value={s.likeRate.toFixed(2) + " %"} note="Likes rapportés aux vues, en moyenne par vidéo." />
        <Metric
          label="Taux de commentaires"
          value={s.commentRate.toFixed(2) + " %"}
          note="Commentaires rapportés aux vues, en moyenne par vidéo."
        />
        <Metric label="Vidéos / mois" value={s.videosParMois.toFixed(1)} note="Moyenne sur toute l'histoire de la chaîne." />
      </div>
    </div>
  );
}
