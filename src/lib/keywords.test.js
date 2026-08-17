import { describe, it, expect } from "vitest";
import { keywordSignals } from "./keywords";

function video(title, rythme) {
  return { title, rythme };
}

describe("keywordSignals", () => {
  it("ne renvoie rien en dessous de 6 vidéos (signal trop faible)", () => {
    const videos = [video("a b c", 1), video("d e f", 2), video("g h i", 3)];
    expect(keywordSignals(videos)).toEqual({ favorables: [], defavorables: [], n: 0 });
  });

  it("repère un mot qui revient uniquement dans les vidéos qui percent", () => {
    const videos = [
      ...Array.from({ length: 10 }, (_, i) => video(`Comment gagner de argent ${i}`, 100 + i)),
      ...Array.from({ length: 10 }, (_, i) => video(`Vlog tranquille dimanche ${i}`, 5 + i)),
    ];
    const { favorables, defavorables } = keywordSignals(videos);
    expect(favorables.map((s) => s.word)).toContain("gagner");
    expect(defavorables.map((s) => s.word)).toContain("vlog");
  });

  it("ignore les mots vides (stopwords)", () => {
    const videos = [
      ...Array.from({ length: 10 }, (_, i) => video(`Le guide pour les débutants ${i}`, 100 + i)),
      ...Array.from({ length: 10 }, (_, i) => video(`Une astuce pour les experts ${i}`, 5 + i)),
    ];
    const { favorables, defavorables } = keywordSignals(videos);
    const words = [...favorables, ...defavorables].map((s) => s.word);
    expect(words).not.toContain("les");
    expect(words).not.toContain("pour");
  });

  it("ne plante pas sur des titres identiques (aucun signal différenciant)", () => {
    const videos = Array.from({ length: 10 }, (_, i) => video("Même titre exact", i));
    expect(() => keywordSignals(videos)).not.toThrow();
  });
});
