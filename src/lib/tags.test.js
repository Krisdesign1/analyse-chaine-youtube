import { describe, it, expect } from "vitest";
import { tagSignals } from "./tags";

function video(tags, rythme) {
  return { tags, rythme };
}

describe("tagSignals", () => {
  it("signale l'absence de tags sans planter", () => {
    const videos = Array.from({ length: 10 }, (_, i) => video([], i));
    const r = tagSignals(videos);
    expect(r.hasTags).toBe(false);
    expect(r.favorables).toEqual([]);
  });

  it("repère un tag présent seulement dans les vidéos qui percent", () => {
    const videos = [
      ...Array.from({ length: 10 }, (_, i) => video(["tuto", "gaming"], 100 + i)),
      ...Array.from({ length: 10 }, (_, i) => video(["vlog", "quotidien"], 5 + i)),
    ];
    const { favorables, defavorables, hasTags } = tagSignals(videos);
    expect(hasTags).toBe(true);
    expect(favorables.map((s) => s.tag)).toContain("tuto");
    expect(defavorables.map((s) => s.tag)).toContain("vlog");
  });

  it("ignore la casse et les espaces superflus", () => {
    const videos = [
      ...Array.from({ length: 10 }, (_, i) => video([" Tuto "], 100 + i)),
      ...Array.from({ length: 10 }, (_, i) => video(["autre"], 5 + i)),
    ];
    const { favorables } = tagSignals(videos);
    expect(favorables.map((s) => s.tag)).toContain("tuto");
  });

  it("fonctionne même si seule une partie des vidéos a des tags", () => {
    const videos = [
      ...Array.from({ length: 10 }, (_, i) => video(["tuto"], 100 + i)),
      ...Array.from({ length: 10 }, (_, i) => video([], 5 + i)), // sans tags
    ];
    expect(() => tagSignals(videos)).not.toThrow();
  });
});
