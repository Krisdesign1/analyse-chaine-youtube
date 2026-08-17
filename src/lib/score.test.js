import { describe, it, expect } from "vitest";
import { healthScore } from "./score";

describe("healthScore", () => {
  it("plafonne à 100 pour une chaîne idéale sur tous les critères", () => {
    const s = healthScore({ portee: 200, tendance: 20, engagement: 8, regularite: 0, cadence: 1 });
    expect(s.total).toBe(100);
    expect(s.label).toBe("Excellente");
  });

  it("plancher à 0 sur chaque critère pour une chaîne dans le rouge partout", () => {
    const s = healthScore({ portee: 0, tendance: -100, engagement: 0, regularite: 10, cadence: 100 });
    expect(s.total).toBe(0);
    expect(s.label).toBe("Critique");
  });

  it("attribue un score neutre de tendance quand elle est null (chaîne trop récente)", () => {
    const s = healthScore({ portee: 0, tendance: null, engagement: 0, regularite: 0, cadence: 30 });
    const tendance = s.breakdown.find((b) => b.label === "Tendance");
    expect(tendance.pts).toBe(10);
  });

  it("ne renvoie jamais de points négatifs ou NaN, même sur des valeurs extrêmes", () => {
    const s = healthScore({ portee: -50, tendance: -1000, engagement: -10, regularite: 999, cadence: -5 });
    s.breakdown.forEach((b) => {
      expect(b.pts).toBeGreaterThanOrEqual(0);
      expect(Number.isNaN(b.pts)).toBe(false);
    });
    expect(Number.isNaN(s.total)).toBe(false);
  });

  it("la somme du détail correspond toujours au total", () => {
    const s = healthScore({ portee: 60, tendance: 3, engagement: 2.5, regularite: 0.8, cadence: 7 });
    const sum = s.breakdown.reduce((acc, b) => acc + b.pts, 0);
    expect(s.total).toBe(sum);
  });
});
