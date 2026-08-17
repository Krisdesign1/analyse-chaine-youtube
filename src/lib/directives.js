import { compact } from "./format";

/* ── Directives calculées localement à partir des chiffres (gratuit, pas d'API tierce) ── */
export function directives(r) {
  const s = r.stats;
  const out = [];

  const formats = s.parFormat.filter((f) => f.n > 0).sort((a, b) => b.med - a.med);
  if (formats.length >= 2) {
    const best = formats[0];
    const worst = formats[formats.length - 1];
    if (best.med > worst.med * 1.2) {
      out.push({
        titre: `Miser sur le format ${best.format}`,
        constat: `${best.format} fait ${compact(best.med)} vues/j (${best.n} vidéos) contre ${compact(worst.med)}/j pour ${worst.format}.`,
        action: `Augmenter la part de ${best.format} dans le calendrier de publication au détriment de ${worst.format}.`,
        priorite: best.med > worst.med * 2 ? "haute" : "moyenne",
      });
    }
  }

  const jours = s.jours.filter((j) => j.n > 0);
  if (jours.length >= 2) {
    const best = jours[0];
    const worst = jours[jours.length - 1];
    if (best.med > worst.med * 1.15) {
      out.push({
        titre: `Publier le ${best.jour}`,
        constat: `Le ${best.jour} atteint une médiane de ${compact(best.med)} vues/j (${best.n} vidéos), contre ${compact(worst.med)}/j le ${worst.jour}.`,
        action: `Caler les prochaines sorties sur ${best.jour} en priorité.`,
        priorite: "moyenne",
      });
    }
  }

  const titres = s.parTitre.filter((t) => t.n > 0).sort((a, b) => b.med - a.med);
  if (titres.length >= 2) {
    const best = titres[0];
    const worst = titres[titres.length - 1];
    if (best.med > worst.med * 1.2) {
      out.push({
        titre: "Longueur de titre à ajuster",
        constat: `Les titres "${best.label}" font ${compact(best.med)} vues/j (${best.n} vidéos) contre ${compact(worst.med)}/j pour "${worst.label}".`,
        action: `Viser des titres de la catégorie "${best.label}" sur les prochaines vidéos.`,
        priorite: "basse",
      });
    }
  }

  if (s.regularite >= 1.2) {
    out.push({
      titre: "Performance imprévisible",
      constat: `L'écart interquartile du rythme atteint ${s.regularite.toFixed(1)}× la médiane : les résultats varient fortement d'une vidéo à l'autre.`,
      action: "Identifier ce qui distingue les vidéos qui cartonnent des autres (sujet, format, titre) pour reproduire les bonnes plus systématiquement.",
      priorite: "moyenne",
    });
  }

  if (s.portee < 50) {
    out.push({
      titre: "Portée sous les abonnés",
      constat: `Vues médianes ${compact(s.medViews)} pour ${compact(r.channel.subs)} abonnés, soit ${s.portee.toFixed(0)} % de portée.`,
      action: "Retravailler miniatures et titres : la chaîne ne dépasse pas sa base d'abonnés actuels.",
      priorite: s.portee < 30 ? "haute" : "moyenne",
    });
  } else if (s.portee >= 150) {
    out.push({
      titre: "Bonne portée hors abonnés",
      constat: `Portée à ${s.portee.toFixed(0)} % : les vidéos touchent bien au-delà des abonnés.`,
      action: "Capitaliser en publiant plus souvent tant que l'algorithme pousse la chaîne.",
      priorite: "basse",
    });
  }

  if (s.tendance != null) {
    if (s.tendance <= -15) {
      out.push({
        titre: "Rythme en baisse",
        constat: `Les 10 dernières vidéos font ${s.tendance.toFixed(0)} % de vues/j de moins que les 10 précédentes, à âge égal.`,
        action: "Comparer ce qui a changé récemment (format, cadence, miniatures) avec la période précédente, plus performante.",
        priorite: "haute",
      });
    } else if (s.tendance >= 15) {
      out.push({
        titre: "Dynamique en hausse",
        constat: `+${s.tendance.toFixed(0)} % de vues/j sur les 10 dernières vidéos vs les 10 précédentes.`,
        action: "Reproduire ce qui a changé récemment et accélérer la cadence tant que la dynamique est favorable.",
        priorite: "moyenne",
      });
    }
  }

  if (s.engagement < 1.5) {
    out.push({
      titre: "Engagement faible",
      constat: `${s.engagement.toFixed(2)} % de likes+commentaires rapportés aux vues : l'audience regarde sans réagir.`,
      action: "Ajouter un appel à commenter en fin de vidéo et répondre aux premiers commentaires pour lancer la discussion.",
      priorite: "moyenne",
    });
  } else if (s.engagement >= 4) {
    out.push({
      titre: "Communauté engagée",
      constat: `${s.engagement.toFixed(2)} % d'engagement, nettement au-dessus de la moyenne.`,
      action: "Exploiter cette base via l'onglet communauté ou des formats participatifs (Q&A, sondages).",
      priorite: "basse",
    });
  }

  if (s.cadence > 10) {
    out.push({
      titre: "Cadence irrégulière",
      constat: `Écart médian de ${s.cadence.toFixed(1)} jours entre deux vidéos.`,
      action: "Resserrer le calendrier de publication : l'algorithme favorise la régularité pour recommander une chaîne.",
      priorite: "moyenne",
    });
  }

  if (s.top.length && s.flop.length) {
    const avg = (arr) => arr.reduce((a, v) => a + v.sec, 0) / arr.length;
    const topSec = avg(s.top);
    const flopSec = avg(s.flop);
    if (Math.abs(topSec - flopSec) > 60) {
      const courtGagne = topSec < flopSec;
      out.push({
        titre: courtGagne ? "Le court fonctionne mieux" : "Le long fonctionne mieux",
        constat: `Durée moyenne ${Math.round(topSec / 60)} min sur le top 5 contre ${Math.round(flopSec / 60)} min sur le flop 5.`,
        action: courtGagne
          ? "Resserrer le montage et viser des formats plus courts sur les prochains sujets."
          : "Ne pas hésiter à développer davantage les sujets qui le méritent.",
        priorite: "basse",
      });
    }
  }

  if (!out.length) {
    out.push({
      titre: "Chaîne équilibrée",
      constat: `Portée ${s.portee.toFixed(0)} %, engagement ${s.engagement.toFixed(2)} %, cadence ${s.cadence.toFixed(1)} j.`,
      action: "Pas de signal fort dans un sens ou l'autre : continuer sur la même ligne et surveiller l'évolution.",
      priorite: "basse",
    });
  }

  return out.slice(0, 6);
}
