/* ── Connexion OAuth Google (gratuite) pour accéder aux données privées ─────
   d'une chaîne : revenus, CTR, rétention, abonnés gagnés/perdus, et scripts
   (sous-titres) de tes propres vidéos.
   N'utilise que Google Identity Services côté navigateur (pas de backend,
   pas de secret exposé) : https://accounts.google.com/gsi/client            */

const SCOPES = [
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
].join(" ");

let tokenClient = null;
let currentToken = null; // { access_token, expires_at }

/* Le script Google (accounts.google.com/gsi/client) se charge en <script async defer> :
   il peut ne pas être prêt au moment du montage de l'app, surtout au rechargement de la
   page. On attend qu'il le soit au lieu d'échouer immédiatement. */
function waitForGis(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(id);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(id);
        reject(
          new Error("La connexion Google n'a pas pu se charger. Vérifie ta connexion internet puis recharge la page.")
        );
      }
    }, 100);
  });
}

/* Doit être appelé une fois le client ID connu, avant toute connexion.
   Renvoie une promesse qui se résout une fois la connexion prête à être utilisée. */
export async function initTokenClient(clientId, onResult) {
  await waitForGis();
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: (resp) => {
      if (resp.error) {
        onResult(null, resp.error_description || resp.error);
        return;
      }
      currentToken = {
        access_token: resp.access_token,
        expires_at: Date.now() + (Number(resp.expires_in || 3600) - 60) * 1000,
      };
      onResult(currentToken.access_token, null);
    },
  });
}

export function connect() {
  if (!tokenClient) throw new Error("Connexion Google non initialisée : ajoute d'abord un ID client OAuth.");
  tokenClient.requestAccessToken({ prompt: "consent" });
}

export function getValidToken() {
  if (currentToken && currentToken.expires_at > Date.now()) return currentToken.access_token;
  return null;
}

export function disconnect() {
  if (currentToken?.access_token && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(currentToken.access_token, () => {});
  }
  currentToken = null;
}

/* Identifie la chaîne du compte Google connecté. */
export async function fetchMyChannel(accessToken) {
  const r = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || "Impossible de récupérer ta chaîne.");
  const ch = j.items?.[0];
  if (!ch) throw new Error("Aucune chaîne YouTube associée à ce compte Google.");
  return {
    id: ch.id,
    title: ch.snippet.title,
    thumb: ch.snippet.thumbnails?.default?.url,
  };
}
