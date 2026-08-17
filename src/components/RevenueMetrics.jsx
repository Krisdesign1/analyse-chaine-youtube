import { C } from "../theme";
import Eyebrow from "./Eyebrow";
import Metric from "./Metric";
import { compact, fmt } from "../lib/format";

export default function RevenueMetrics({ data }) {
  if (!data) return null;

  const hasRevenue = data.estimatedRevenue != null;
  const hasWatchTime = data.estimatedMinutesWatched != null;
  const hasRetention = data.averageViewPercentage != null;
  const hasSubs = data.subscribersGained != null;

  if (!hasRevenue && !hasWatchTime && !hasRetention && !hasSubs) return null;

  return (
    <div className="mt-8">
      <Eyebrow>Données privées de ta chaîne · {data.days} derniers jours</Eyebrow>
      <div className="grid grid-cols-4 gap-x-6 gap-y-5">
        {hasRevenue && (
          <Metric
            label="Revenus estimés"
            value={"$" + fmt(data.estimatedRevenue)}
            note={data.cpm != null ? `CPM ${(+data.cpm).toFixed(2)} $` : undefined}
          />
        )}
        {hasWatchTime && (
          <Metric
            label="Temps de visionnage"
            value={compact(data.estimatedMinutesWatched) + " min"}
            note="Minutes cumulées visionnées sur la période."
          />
        )}
        {hasRetention && (
          <Metric
            label="Rétention moyenne"
            value={(+data.averageViewPercentage).toFixed(0) + " %"}
            note={data.averageViewDuration != null ? `${Math.round(data.averageViewDuration)} s vus en moyenne` : undefined}
          />
        )}
        {hasSubs && (
          <Metric
            label="Abonnés (solde)"
            value={
              (data.subscribersGained - data.subscribersLost >= 0 ? "+" : "") +
              fmt(data.subscribersGained - data.subscribersLost)
            }
            note={`${fmt(data.subscribersGained)} gagnés · ${fmt(data.subscribersLost)} perdus`}
          />
        )}
      </div>
      {!hasRevenue && (
        <div style={{ color: C.muted, fontSize: 12 }} className="mt-3">
          Revenus non disponibles{data._errors?.revenue ? ` : ${data._errors.revenue}` : " : chaîne non monétisée, ou droits insuffisants sur ce compte Google"}.
        </div>
      )}
      <div style={{ color: C.muted, fontSize: 11 }} className="mt-3">
        Le CTR des miniatures et les impressions (visibles dans YouTube Studio) ne sont pas exposés par l'API
        YouTube Analytics publique — Google ne les rend disponibles que dans l'interface Studio elle-même.
      </div>
    </div>
  );
}
