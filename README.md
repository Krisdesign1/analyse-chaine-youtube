# Analyse de chaîne YouTube

Colle un lien de chaîne YouTube, obtiens son rythme de publication, sa portée par rapport à ses
abonnés, son engagement, ses meilleurs formats/jours, un score de santé global, les mots et tags
qui reviennent dans les vidéos qui percent, ce que dit l'audience dans les commentaires, et des
directives concrètes générées à partir de ses propres chiffres. En connectant ta propre chaîne,
débloque en plus revenus, temps de visionnage, rétention, abonnés gagnés/perdus, et le script des
25 premières secondes (le "hook") de tes vidéos qui marchent le mieux et le moins bien. Compare
deux chaînes côte à côte, garde un historique de tes propres analyses pour suivre ta progression,
cherche les vidéos les plus vues sur toute la plateforme pour un mot-clé, et exporte le tout en
PDF.

100 % gratuit : aucune API payante. Interface pensée pour un usage **desktop** (panneau latéral +
zone de contenu large), thème sombre "régie nocturne" inspiré du système
[Factory](https://styles.refero.design/style/13d6fc89-eba2-4724-ac37-20f4f2e5efec) — surface noire,
profondeur par contraste plutôt que par ombre, accent orange unique réservé aux données live et
positives.

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvre l'URL affichée (par défaut `http://localhost:5173`).

## 1. Clé API YouTube Data v3 (obligatoire, gratuite)

Nécessaire pour analyser n'importe quelle chaîne à partir de ses données publiques.

1. Va sur [console.cloud.google.com](https://console.cloud.google.com).
2. Crée un projet, puis active l'API **YouTube Data API v3** (barre de recherche → nom de l'API →
   Activer).
3. Menu ☰ → **API et services** → **Identifiants** → **Créer des identifiants** → **Clé API**.
4. Copie la clé (`AIzaSy...`) et colle-la dans l'application au premier lancement.
5. Optionnel mais recommandé : restreins la clé (édite-la → *Restrictions relatives aux API* →
   coche YouTube Data API v3 ; *Restrictions relatives aux applications* → référents HTTP →
   ajoute `localhost/*` et ton domaine de production).

Quota : 10 000 unités/jour, aucune carte bancaire requise. Une analyse coûte environ 2 unités par
tranche de 50 vidéos de la chaîne.

## 2. Connexion Google (optionnelle, gratuite) — revenus, rétention, abonnés, scripts

Ces données sont privées : YouTube ne les expose qu'au propriétaire de la chaîne connecté, jamais
via une simple clé API, quelle que soit la chaîne analysée. Cette section n'apporte donc des
chiffres que lorsque tu analyses **ta propre chaîne**, après connexion.

Fournit : revenus estimés, CPM, temps de visionnage, rétention moyenne, abonnés gagnés/perdus, et
le script des 25 premières secondes ("hook") de tes vidéos qui percent et qui flop (nécessite que
la vidéo ait des sous-titres, manuels ou automatiques).
**Ne fournit pas** : le CTR des miniatures ni les impressions — ces deux métriques, visibles dans
YouTube Studio, ne sont pas exposées par l'API YouTube Analytics publique (l'API renvoie une
erreur "Unknown identifier" si on les demande) ; Google les garde réservées à l'interface Studio.
Ce n'est pas une limite de cette application, mais de la plateforme elle-même.

> Si tu étais déjà connecté avant l'ajout des scripts : reconnecte-toi une fois (bouton
> "Connecter" à nouveau) pour accepter le scope supplémentaire nécessaire aux sous-titres.

**a) Créer l'écran de consentement OAuth**
1. Dans le même projet Google Cloud, menu ☰ → **API et services** → **Écran de consentement
   OAuth**.
2. Type d'utilisateur : *Externe*. Remplis le nom de l'app et ton e-mail, enregistre.
3. Reste en statut **Test** (pas besoin de publier/valider l'app pour un usage personnel) et
   ajoute ton propre compte Google dans **Utilisateurs test**.
4. Sous **Scopes**, ajoute (recherche manuelle si besoin) :
   - `.../auth/yt-analytics.readonly`
   - `.../auth/yt-analytics-monetary.readonly`
   - `.../auth/youtube.readonly`
   - `.../auth/youtube.force-ssl` (nécessaire pour lire les sous-titres de tes vidéos)

**b) Activer l'API YouTube Analytics**
- Barre de recherche → `YouTube Analytics API` → **Activer**.

**c) Créer l'ID client OAuth**
1. **Identifiants** → **Créer des identifiants** → **ID client OAuth**.
2. Type d'application : **Application Web**.
3. **Origines JavaScript autorisées** : ajoute exactement l'URL utilisée pour ouvrir l'app, par
   exemple `http://localhost:5173` en local (le port doit correspondre), et ton domaine de
   production plus tard.
4. Crée, copie l'ID client (`xxxxx.apps.googleusercontent.com`) — pas de "secret" à gérer, c'est
   un identifiant public conçu pour tourner côté navigateur.

**d) Se connecter dans l'app**
1. Colle l'ID client dans le panneau "Revenus · rétention" à gauche.
2. Clique **Connecter ma chaîne avec Google**, choisis ton compte, accepte les autorisations.
3. Lance une analyse sur ta propre chaîne : un bloc "Données privées de ta chaîne" apparaît avec
   revenus estimés, temps de visionnage, rétention moyenne et solde d'abonnés (90 derniers jours).

Le jeton de connexion reste uniquement en mémoire (jamais sauvegardé sur disque) et expire après
environ une heure — il faut alors se reconnecter. Si la chaîne n'est pas monétisée ou que
certaines métriques sont refusées par l'API, l'app se rabat automatiquement sur un socle de
données plus restreint (vues, rétention, abonnés) plutôt que d'échouer entièrement.

## Build de production

```bash
npm run build
```

Génère un dossier `dist/` statique, déployable gratuitement sur n'importe quel hébergeur de
fichiers statiques (GitHub Pages, Cloudflare Pages, Netlify, Vercel). N'oublie pas d'ajouter le
domaine de production aux origines JavaScript autorisées de l'ID client OAuth si tu utilises la
connexion Google.

```bash
npm run preview   # sert dist/ localement pour vérifier le build
```

## Tests

```bash
npm test          # lance la suite une fois
npm run test:watch  # mode watch pendant le développement
```

Suite [Vitest](https://vitest.dev) (gratuite, intégrée à Vite) couvrant toute la logique pure de
`src/lib/` — 13 fichiers, 85 tests : résolution de lien, calcul des statistiques (avec l'API
YouTube mockée), score de santé, moteur de directives, signaux de mots-clés et de tags, analyse des
commentaires, découpage des scripts (SRT → hook), revenus par vidéo, recherche de tendances,
historique des analyses (avec `localStorage` simulé, y compris le cas où il est bloqué), robustesse
par groupes de l'API Analytics, et l'attente du script Google Identity Services. Les composants
React (rendu, clics, animations) ne sont pas couverts — seule la logique métier l'est.

### CI (GitHub Actions)

Un fichier `.github/workflows/ci.yml` est prêt : à chaque push sur `main` ou chaque pull request,
il lance automatiquement `npm test` puis `npm run build` sur les serveurs de GitHub, gratuitement.
Il reste **inerte tant que le projet n'est pas un dépôt Git poussé sur GitHub** — `git init`, la
création du dépôt distant et le premier push sont volontairement laissés à ton initiative plutôt
que faits automatiquement.

## Structure du projet

```
src/
  main.jsx                    point d'entrée React
  App.jsx                     orchestration de l'état, mise en page desktop
  theme.js                    palette de couleurs et polices
  lib/
    format.js                  formatage nombres, dates, médiane, export CSV
    text.js                    tokenisation partagée (titres, tags, commentaires)
    youtube.js                 appels à l'API YouTube Data v3 + calcul des statistiques
    directives.js              recommandations (règles locales, sans IA payante)
    oauth.js                   connexion Google Identity Services, gestion du jeton
    youtubeAnalytics.js        appels à l'API YouTube Analytics (revenus, rétention, abonnés)
    score.js                   score de santé global (0-100) à partir des statistiques
    keywords.js                mots-clés qui distinguent les titres qui percent des flops
    tags.js                    tags qui distinguent les vidéos qui percent des flops
    comments.js                analyse du texte des commentaires (mots fréquents, questions)
    hooks.js                   script des 25 premières secondes, via les sous-titres (ta chaîne)
    trends.js                  recherche des vidéos les plus vues sur toute la plateforme
    snapshots.js               historique local des analyses passées, par chaîne
  components/
    Eyebrow.jsx, Metric.jsx, KeyForm.jsx, SearchBar.jsx, ConnectChannel.jsx,
    CompareChannel.jsx, CompareTable.jsx, RhythmStrip.jsx, ChannelHeader.jsx, StatsGrid.jsx,
    AdvancedStats.jsx, HealthScore.jsx, SnapshotDelta.jsx, RevenueMetrics.jsx, TrendChart.jsx,
    KeywordSignals.jsx, TagSignals.jsx, CommentSignals.jsx, HooksPanel.jsx, TrendSearch.jsx,
    TrendResults.jsx, FormatDayBreakdown.jsx, DirectivesList.jsx, TopFlopLists.jsx,
    VideoTable.jsx, ExportButton.jsx, PrintButton.jsx
```

- **`lib/youtube.js`** : résout un lien (`@handle`, `/channel/UC...`, `/user/...`, `/c/...`, ou
  recherche libre), récupère la chaîne et **toutes** ses vidéos publiques (pagination complète,
  sans plafond), calcule les métriques sur l'ensemble : rythme de vues/jour, médiane, tendance,
  engagement (global + taux de likes et de commentaires séparés), régularité (écart interquartile
  du rythme, pour distinguer une chaîne prévisible d'une chaîne à coups de chance ponctuels),
  répartition par format, par jour, par longueur de titre, et historique mensuel sur toute la
  durée de vie de la chaîne (pas seulement les vidéos récentes).
- **`lib/directives.js`** : 4 à 6 recommandations actionnables par un jeu de règles appliqué aux
  statistiques (format, jour, longueur de titre, portée, tendance, engagement, cadence,
  régularité, durée top vs flop — pas d'appel réseau, pas de coût).
- **`lib/oauth.js`** / **`lib/youtubeAnalytics.js`** : connexion OAuth et lecture des données
  privées, isolées du reste — l'app fonctionne intégralement sans elles.
  `fetchVideoRevenue` récupère les revenus **vidéo par vidéo** (`dimensions=video`), pas
  seulement le total agrégé sur la chaîne.
- **`TrendChart`** : évolution mois par mois sur toute l'histoire de la chaîne, pas seulement une
  fenêtre glissante des dernières vidéos.
- **`VideoTable`** : tableau complet de toutes les vidéos analysées, triable par n'importe quelle
  colonne (date, vues, rythme, likes, commentaires, durée, et revenus si ta chaîne est connectée)
  et filtrable par titre, paginé par 50 lignes à l'écran — mais à l'impression/export PDF,
  **toutes** les vidéos filtrées s'affichent d'un coup (la pagination se lève automatiquement le
  temps de l'impression, via les événements `beforeprint`/`afterprint`), pour ne jamais te
  retrouver avec un PDF tronqué à la première page.
- **`lib/score.js`** : synthétise portée, tendance, engagement, régularité et cadence en un score
  0-100 (avec le détail par critère) — un repère rapide plutôt que cinq chiffres à interpréter
  séparément.
- **`lib/keywords.js`** : compare les mots des titres des vidéos les plus performantes à ceux des
  moins performantes (hors mots vides), pour repérer un vocabulaire qui marche ou qui dessert.
- **`lib/snapshots.js`** : à chaque analyse, un instantané des indicateurs clés est gardé en local
  (par chaîne, jusqu'à 20 instantanés) ; l'analyse suivante de la même chaîne affiche l'écart
  depuis la précédente (score, portée, tendance, engagement, abonnés).
- **`lib/tags.js`** : gratuit et immédiat — les tags sont déjà présents dans les données
  récupérées (`snippet.tags`), aucun appel API en plus.
- **`lib/comments.js`** : échantillonne les vidéos qui percent et qui flop (top + flop 10 par
  défaut), récupère leurs commentaires les plus pertinents (public, clé API simple) et en tire les
  mots récurrents et les questions fréquentes — lancé en arrière-plan après l'analyse principale,
  n'en retarde pas l'affichage.
- **`lib/hooks.js`** : télécharge le sous-titre des vidéos échantillonnées de **ta propre chaîne**
  connectée et n'en garde que les 25 premières secondes. `captions.download` n'est autorisé par
  l'API que pour le propriétaire de la vidéo — impossible d'obtenir le script d'une chaîne tierce
  par ce biais, quel que soit l'outil utilisé.
- **`lib/trends.js`** : recherche manuelle et ponctuelle des vidéos les plus vues sur toute la
  plateforme pour un mot-clé (`search.list`, 100 unités de quota par recherche — c'est pour ça
  qu'elle n'est jamais lancée automatiquement, contrairement au reste).
- **Comparaison** : un second lien optionnel dans le panneau de gauche lance une deuxième analyse
  complète et affiche un tableau comparatif (score de santé et indicateurs clés, chaîne par
  chaîne, avec la valeur la plus favorable mise en évidence).
- **Export PDF** : bouton "Exporter en PDF" à côté de l'export CSV — utilise l'impression native du
  navigateur (`Ctrl/Cmd+P` → Enregistrer en PDF), sans dépendance ni service tiers ; le panneau
  latéral et les contrôles interactifs sont masqués à l'impression.
- **`SectionNav`** : sommaire fixe en haut de la zone de résultats (score, revenus, scripts,
  comparaison, tendance, mots-clés/tags, commentaires, formats/jours, directives, top/flop,
  vidéos) — ne liste que les sections qui ont effectivement du contenu pour l'analyse en cours, et
  scrolle en douceur jusqu'à la section choisie. Devient nécessaire dès qu'on connecte sa chaîne et
  compare, vu le nombre de sections que la page empile.
- Chaque composant a une seule responsabilité et ne connaît que les props qu'on lui passe.
- **`RhythmStrip`** affiche au maximum les 300 vidéos les plus récentes sous forme de barres (au
  delà, des milliers de barres d'un pixel ne se lisent plus) ; toutes les autres statistiques
  restent calculées sur l'intégralité des vidéos.
- **Mise en page** : panneau latéral fixe (contrôles, connexion) + zone de contenu large
  (résultats), pensée pour un écran de bureau plutôt qu'un usage mobile.

## Données utilisées

- **Publiques** (API YouTube Data v3, toute chaîne) : vues, likes, commentaires, durées, dates de
  publication, statistiques de la chaîne.
- **Privées** (API YouTube Analytics, uniquement après connexion sur ta propre chaîne) : revenus
  estimés, CPM, temps de visionnage, rétention moyenne, abonnés gagnés/perdus. Le CTR des
  miniatures et les impressions ne sont pas inclus : l'API publique ne les expose pas, quelle que
  soit l'application utilisée — seule l'interface YouTube Studio y a accès.

## Historique

Le fichier `legacy/analyse-chaine-youtube.jsx` est l'ancien prototype monofichier, conservé pour
référence. Il n'est plus utilisé par l'application.
