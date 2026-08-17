import { describe, it, expect } from "vitest";
import { fmt, compact, median, parseDuration, ageDays, dayName, toCSV } from "./format";

describe("fmt", () => {
  it("affiche un tiret pour null/undefined", () => {
    expect(fmt(null)).toBe("—");
    expect(fmt(undefined)).toBe("—");
  });

  it("formate avec le séparateur de milliers fr-FR", () => {
    expect(fmt(1234)).toBe("1 234");
  });

  it("arrondit les décimales", () => {
    expect(fmt(1234.6)).toBe("1 235");
  });
});

describe("compact", () => {
  it("affiche un tiret pour null", () => {
    expect(compact(null)).toBe("—");
  });

  it("garde les petits nombres tels quels", () => {
    expect(compact(999)).toBe("999");
  });

  it("compacte en k au-delà de 1000", () => {
    expect(compact(1500)).toBe("1,5 k");
  });

  it("compacte en M au-delà de 1e6", () => {
    expect(compact(2_300_000)).toBe("2,3 M");
  });
});

describe("median", () => {
  it("retourne 0 pour un tableau vide", () => {
    expect(median([])).toBe(0);
  });

  it("retourne l'élément central pour un nombre impair", () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it("moyenne les deux éléments centraux pour un nombre pair", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("ne modifie pas le tableau d'origine (tri sur copie)", () => {
    const a = [3, 1, 2];
    median(a);
    expect(a).toEqual([3, 1, 2]);
  });
});

describe("parseDuration", () => {
  it("retourne 0 pour une entrée vide ou invalide", () => {
    expect(parseDuration("")).toBe(0);
    expect(parseDuration(undefined)).toBe(0);
  });

  it("parse minutes et secondes (format YouTube standard)", () => {
    expect(parseDuration("PT4M13S")).toBe(4 * 60 + 13);
  });

  it("parse heures, minutes et secondes", () => {
    expect(parseDuration("PT1H2M3S")).toBe(3600 + 120 + 3);
  });

  it("parse les jours (vidéos très longues / live)", () => {
    expect(parseDuration("P1DT2H")).toBe(86400 + 7200);
  });

  it("parse une durée de secondes seules", () => {
    expect(parseDuration("PT45S")).toBe(45);
  });
});

describe("ageDays", () => {
  it("a un plancher de 1 jour pour une publication très récente", () => {
    const now = new Date().toISOString();
    expect(ageDays(now)).toBeGreaterThanOrEqual(1);
  });

  it("calcule correctement pour une date passée", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();
    expect(ageDays(tenDaysAgo)).toBeCloseTo(10, 0);
  });
});

describe("dayName", () => {
  it("renvoie le bon jour de la semaine en français", () => {
    // 2024-01-01 est un lundi
    expect(dayName("2024-01-01T12:00:00Z")).toBe("lundi");
  });
});

describe("toCSV", () => {
  it("génère un en-tête et une ligne par vidéo", () => {
    const videos = [
      { date: "2024-01-01", title: "Titre simple", views: 100, likes: 5, comments: 1, sec: 60, format: "Short", rythme: 12.3 },
    ];
    const csv = toCSV(videos);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("date,titre,vues,likes,commentaires,duree_sec,format,vues_par_jour");
    expect(lines[1]).toContain("Titre simple");
    expect(lines[1]).toContain("100");
  });

  it("échappe les guillemets dans les titres", () => {
    const videos = [
      { date: "2024-01-01", title: 'Il a dit "salut"', views: 1, likes: 0, comments: 0, sec: 10, format: "Short", rythme: 1 },
    ];
    const csv = toCSV(videos);
    expect(csv).toContain('"Il a dit ""salut"""');
  });
});
