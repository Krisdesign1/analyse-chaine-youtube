import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// oauth.js s'appuie sur window.google (Google Identity Services, chargé en <script async defer>) :
// on simule son arrivée tardive pour vérifier que l'app attend au lieu d'échouer immédiatement.
describe("initTokenClient / attente du script Google", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    globalThis.window = {};
  });

  afterEach(() => {
    vi.useRealTimers();
    delete globalThis.window;
  });

  it("résout dès que window.google.accounts.oauth2 devient disponible", async () => {
    const { initTokenClient } = await import("./oauth");
    const initTokenClientMock = vi.fn(() => ({ requestAccessToken: vi.fn() }));

    const promise = initTokenClient("client-id", () => {});

    // Le script arrive après 300ms, avant le délai d'attente (8s).
    setTimeout(() => {
      globalThis.window.google = { accounts: { oauth2: { initTokenClient: initTokenClientMock } } };
    }, 300);

    await vi.advanceTimersByTimeAsync(500);
    await promise;

    expect(initTokenClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: "client-id" })
    );
  });

  it("rejette proprement si le script ne charge jamais dans le délai imparti", async () => {
    const { initTokenClient } = await import("./oauth");
    const promise = initTokenClient("client-id", () => {});
    const assertion = expect(promise).rejects.toThrow(/n'a pas pu se charger/);
    await vi.advanceTimersByTimeAsync(9000);
    await assertion;
  });
});

describe("connect", () => {
  beforeEach(() => {
    vi.resetModules();
    globalThis.window = {};
  });

  afterEach(() => {
    delete globalThis.window;
  });

  it("lève une erreur claire si on tente de se connecter avant l'initialisation", async () => {
    const { connect } = await import("./oauth");
    expect(() => connect()).toThrow(/non initialisée/);
  });
});
