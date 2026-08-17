/* ── Tokenisation partagée (titres, tags, commentaires) ──────────────
   Filtre grammatical minimal ; les mots "bruit" propres à un contexte
   (ex. "comment"/"pourquoi" dans un titre, mais pas dans un commentaire
   où ils signalent une question) se passent en `extraStopwords`. */

export const BASE_STOPWORDS = new Set([
  "le", "la", "les", "de", "des", "un", "une", "et", "a", "dans", "pour", "sur", "avec",
  "ce", "cet", "cette", "ces", "qui", "que", "qu", "en", "du", "au", "aux", "ou", "est",
  "son", "sa", "ses", "mon", "ma", "mes", "ton", "ta", "tes", "notre", "nos", "votre",
  "vos", "leur", "leurs", "se", "ne", "pas", "on", "il", "elle", "ils", "elles", "je",
  "tu", "nous", "vous", "the", "an", "of", "in", "for", "to", "and", "is", "with",
  "you", "your", "cest", "jai", "nest", "etc", "www", "com", "http", "https",
]);

export function tokenize(text, extraStopwords = []) {
  const stop = extraStopwords.length ? new Set([...BASE_STOPWORDS, ...extraStopwords]) : BASE_STOPWORDS;
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stop.has(w));
}
