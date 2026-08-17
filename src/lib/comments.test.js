import { describe, it, expect, vi, afterEach } from "vitest";
import { analyseComments } from "./comments";

function commentsResponse(texts) {
  return {
    ok: true,
    json: async () => ({
      items: texts.map((t) => ({ snippet: { topLevelComment: { snippet: { textOriginal: t } } } })),
    }),
  };
}

describe("analyseComments", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renvoie null si aucun commentaire n'a pu être récupéré", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({}) }))
    );
    const videos = Array.from({ length: 4 }, (_, i) => ({ id: `v${i}`, rythme: i }));
    const r = await analyseComments(videos, "KEY");
    expect(r).toBeNull();
  });

  it("dégrade sans planter quand une vidéo a les commentaires désactivés", async () => {
    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        call++;
        if (call === 1) return { ok: false, json: async () => ({ error: { errors: [{ reason: "commentsDisabled" }] } }) };
        return commentsResponse(["Super vidéo !", "Génial"]);
      })
    );
    const videos = [
      { id: "v1", rythme: 100 },
      { id: "v2", rythme: 1 },
    ];
    const r = await analyseComments(videos, "KEY");
    expect(r).not.toBeNull();
    expect(r.commentsAnalysed).toBe(2);
  });

  it("détecte les questions et les mots récurrents", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        commentsResponse([
          "Comment tu as fait ce montage ?",
          "Super montage, bravo !",
          "Quel logiciel de montage utilises-tu ?",
          "J'adore ce montage",
        ])
      )
    );
    const videos = Array.from({ length: 6 }, (_, i) => ({ id: `v${i}`, rythme: i }));
    const r = await analyseComments(videos, "KEY", { sampleSize: 1 });
    expect(r.topWords.some((w) => w.word === "montage")).toBe(true);
    expect(r.sampleQuestions.length).toBeGreaterThan(0);
    expect(r.sampleQuestions.every((q) => q.includes("?"))).toBe(true);
  });

  it("ne dédouble pas une vidéo présente à la fois dans le top et le flop (petit échantillon)", async () => {
    const fetchMock = vi.fn(async () => commentsResponse(["ok"]));
    vi.stubGlobal("fetch", fetchMock);
    const videos = [{ id: "only-one", rythme: 5 }];
    await analyseComments(videos, "KEY", { sampleSize: 10 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
