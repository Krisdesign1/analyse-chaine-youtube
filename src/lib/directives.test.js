import { describe, it, expect } from "vitest";
import { directives } from "./directives";

function fakeResult(overrides = {}) {
  const base = {
    channel: { title: "Test", subs: 1000 },
    videos: [],
    stats: {
      medViews: 1000,
      medRythme: 50,
      portee: 60,
      cadence: 5,
      tendance: 0,
      engagement: 2,
      regularite: 0.5,
      parFormat: [
        { format: "Short", n: 5, med: 50 },
        { format: "Standard", n: 5, med: 40 },
        { format: "Longue", n: 0, med: 0 },
      ],
      parTitre: [
        { label: "Court (< 40 car.)", n: 5, med: 45 },
        { label: "Moyen (40-70 car.)", n: 5, med: 45 },
        { label: "Long (> 70 car.)", n: 0, med: 0 },
      ],
      jours: [
        { jour: "lundi", n: 3, med: 55 },
        { jour: "mardi", n: 3, med: 45 },
      ],
      top: [{ title: "A", views: 100, sec: 60 }],
      flop: [{ title: "B", views: 10, sec: 900 }],
    },
  };
  return { ...base, ...overrides, stats: { ...base.stats, ...(overrides.stats || {}) } };
}

describe("directives", () => {
  it("ne plante jamais sur une seule vidéo et renvoie au moins une directive", () => {
    const r = fakeResult({
      stats: {
        parFormat: [{ format: "Short", n: 1, med: 10 }],
        parTitre: [{ label: "Court (< 40 car.)", n: 1, med: 10 }],
        jours: [{ jour: "lundi", n: 1, med: 10 }],
        top: [{ title: "A", views: 10, sec: 30 }],
        flop: [{ title: "A", views: 10, sec: 30 }],
      },
    });
    expect(() => directives(r)).not.toThrow();
    expect(directives(r).length).toBeGreaterThan(0);
  });

  it("renvoie au maximum 6 directives", () => {
    const r = fakeResult({
      stats: {
        portee: 10,
        tendance: -50,
        engagement: 0.2,
        regularite: 3,
        cadence: 40,
        parFormat: [
          { format: "Short", n: 10, med: 200 },
          { format: "Standard", n: 10, med: 20 },
        ],
        parTitre: [
          { label: "Court (< 40 car.)", n: 10, med: 200 },
          { label: "Long (> 70 car.)", n: 10, med: 20 },
        ],
      },
    });
    expect(directives(r).length).toBeLessThanOrEqual(6);
  });

  it("donne une directive de repli si aucun seuil n'est franchi", () => {
    const r = fakeResult({
      stats: {
        portee: 70,
        tendance: 0,
        engagement: 2,
        regularite: 0.8,
        cadence: 5,
        parFormat: [{ format: "Short", n: 5, med: 50 }],
        parTitre: [{ label: "Moyen (40-70 car.)", n: 5, med: 50 }],
        jours: [{ jour: "lundi", n: 5, med: 50 }],
        top: [{ title: "A", views: 100, sec: 300 }],
        flop: [{ title: "B", views: 90, sec: 310 }],
      },
    });
    const out = directives(r);
    expect(out.length).toBeGreaterThan(0);
    expect(out.some((d) => d.titre === "Chaîne équilibrée")).toBe(true);
  });

  it("chaque directive a les 4 champs attendus", () => {
    const r = fakeResult();
    directives(r).forEach((d) => {
      expect(d).toHaveProperty("titre");
      expect(d).toHaveProperty("constat");
      expect(d).toHaveProperty("action");
      expect(["haute", "moyenne", "basse"]).toContain(d.priorite);
    });
  });

  it("déclenche l'alerte de régularité au-delà du seuil", () => {
    const r = fakeResult({ stats: { regularite: 1.5 } });
    const out = directives(r);
    expect(out.some((d) => d.titre === "Performance imprévisible")).toBe(true);
  });

  it("ne déclenche pas l'alerte de régularité sous le seuil", () => {
    const r = fakeResult({ stats: { regularite: 0.3 } });
    const out = directives(r);
    expect(out.some((d) => d.titre === "Performance imprévisible")).toBe(false);
  });
});
