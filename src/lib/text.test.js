import { describe, it, expect } from "vitest";
import { tokenize } from "./text";

describe("tokenize", () => {
  it("passe en minuscules et retire la ponctuation", () => {
    expect(tokenize("Bonjour, Monde !")).toEqual(["bonjour", "monde"]);
  });

  it("retire les accents", () => {
    expect(tokenize("Créer une vidéo")).toContain("creer");
  });

  it("filtre les mots vides de base", () => {
    const words = tokenize("le chat et la souris");
    expect(words).not.toContain("le");
    expect(words).not.toContain("et");
    expect(words).not.toContain("la");
  });

  it("filtre les mots de moins de 3 caractères", () => {
    expect(tokenize("un ça va ok")).toEqual([]);
    expect(tokenize("il y a un os")).toEqual([]);
  });

  it("accepte des mots vides supplémentaires en paramètre", () => {
    expect(tokenize("comment faire cela", ["comment"])).not.toContain("comment");
    expect(tokenize("comment faire cela")).toContain("comment");
  });

  it("gère une entrée vide sans planter", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize(undefined)).toEqual([]);
  });
});
