import { useState, useEffect } from "react";
import { C, MONO, SANS } from "./theme";
import Eyebrow from "./components/Eyebrow";
import KeyForm from "./components/KeyForm";
import SearchBar from "./components/SearchBar";
import ConnectChannel from "./components/ConnectChannel";
import ChannelHeader from "./components/ChannelHeader";
import RhythmStrip from "./components/RhythmStrip";
import StatsGrid from "./components/StatsGrid";
import AdvancedStats from "./components/AdvancedStats";
import HealthScore from "./components/HealthScore";
import SnapshotDelta from "./components/SnapshotDelta";
import RevenueMetrics from "./components/RevenueMetrics";
import TrendChart from "./components/TrendChart";
import KeywordSignals from "./components/KeywordSignals";
import FormatDayBreakdown from "./components/FormatDayBreakdown";
import DirectivesList from "./components/DirectivesList";
import TopFlopLists from "./components/TopFlopLists";
import VideoTable from "./components/VideoTable";
import ExportButton from "./components/ExportButton";
import PrintButton from "./components/PrintButton";
import CompareChannel from "./components/CompareChannel";
import CompareTable from "./components/CompareTable";
import TagSignals from "./components/TagSignals";
import CommentSignals from "./components/CommentSignals";
import HooksPanel from "./components/HooksPanel";
import TrendSearch from "./components/TrendSearch";
import TrendResults from "./components/TrendResults";
import SectionNav from "./components/SectionNav";
import ErrorBoundary from "./components/ErrorBoundary";
import QuotaMeter from "./components/QuotaMeter";
import TrackedChannels from "./components/TrackedChannels";
import { analyse } from "./lib/youtube";
import { directives } from "./lib/directives";
import { initTokenClient, connect as oauthConnect, disconnect as oauthDisconnect, getValidToken, fetchMyChannel } from "./lib/oauth";
import { fetchChannelAnalytics, fetchVideoRevenue } from "./lib/youtubeAnalytics";
import { healthScore } from "./lib/score";
import { keywordSignals } from "./lib/keywords";
import { tagSignals } from "./lib/tags";
import { analyseComments } from "./lib/comments";
import { fetchHooks } from "./lib/hooks";
import { searchTrending } from "./lib/trends";
import { lastSnapshot, addSnapshot, deltaSince, allChannels } from "./lib/snapshots";
import { getQuotaUsed } from "./lib/quota";

const KEY_STORAGE = "yt:key";
const HISTORY_STORAGE = "yt:history";
const OAUTH_CLIENT_STORAGE = "yt:oauthClientId";

export default function App() {
  const [key, setKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [link, setLink] = useState("");
  const [step, setStep] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState(null);
  const [tips, setTips] = useState(null);
  const [tipsErr, setTipsErr] = useState("");
  const [history, setHistory] = useState([]);

  const [oauthClientIdSaved, setOauthClientIdSaved] = useState(false);
  const [oauthReady, setOauthReady] = useState(false);
  const [connectedChannel, setConnectedChannel] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connectErr, setConnectErr] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsNote, setAnalyticsNote] = useState("");
  const [videoRevenue, setVideoRevenue] = useState(null);

  const [keywordData, setKeywordData] = useState(null);
  const [tagData, setTagData] = useState(null);
  const [snapshotDelta, setSnapshotDelta] = useState(null);

  const [commentData, setCommentData] = useState(null);
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentStep, setCommentStep] = useState("");

  const [hooksData, setHooksData] = useState(null);
  const [hooksBusy, setHooksBusy] = useState(false);
  const [hooksStep, setHooksStep] = useState("");

  const [resB, setResB] = useState(null);
  const [compareBusy, setCompareBusy] = useState(false);
  const [compareErr, setCompareErr] = useState("");
  const [compareStep, setCompareStep] = useState("");

  const [trendQuery, setTrendQuery] = useState("");
  const [trendResults, setTrendResults] = useState(null);
  const [trendBusy, setTrendBusy] = useState(false);
  const [trendErr, setTrendErr] = useState("");

  const [quotaUsed, setQuotaUsed] = useState(0);
  const [trackedChannels, setTrackedChannels] = useState([]);
  const refreshQuota = () => setQuotaUsed(getQuotaUsed());
  const refreshTracked = () => setTrackedChannels(allChannels());

  const onTokenResult = (accessToken, error) => {
    setConnecting(false);
    if (error) {
      setConnectErr(error);
      return;
    }
    fetchMyChannel(accessToken)
      .then((ch) => setConnectedChannel(ch))
      .catch((e) => setConnectErr(e.message))
      .finally(refreshQuota);
  };

  // Initialise la connexion Google : attend que le script accounts.google.com/gsi/client
  // soit chargé (voir initTokenClient) avant de considérer le bouton "Connecter" utilisable.
  const initOauth = (clientId) => {
    setConnectErr("");
    setOauthReady(false);
    initTokenClient(clientId, onTokenResult)
      .then(() => setOauthReady(true))
      .catch((e) => setConnectErr(e.message));
  };

  useEffect(() => {
    try {
      const k = localStorage.getItem(KEY_STORAGE);
      if (k) {
        setKey(k);
        setKeySaved(true);
      }
    } catch (e) {}
    try {
      const h = localStorage.getItem(HISTORY_STORAGE);
      if (h) setHistory(JSON.parse(h));
    } catch (e) {}
    try {
      const c = localStorage.getItem(OAUTH_CLIENT_STORAGE);
      if (c) {
        setOauthClientIdSaved(true);
        initOauth(c);
      }
    } catch (e) {}
    refreshQuota();
    refreshTracked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveKey = (k) => {
    const trimmed = k.trim();
    try {
      localStorage.setItem(KEY_STORAGE, trimmed);
    } catch (e) {
      setErr("La clé n'a pas pu être enregistrée. Elle marchera quand même pour cette session.");
    }
    setKey(trimmed);
    setKeySaved(true);
  };

  const saveClientId = (id) => {
    const trimmed = id.trim();
    try {
      localStorage.setItem(OAUTH_CLIENT_STORAGE, trimmed);
    } catch (e) {}
    setOauthClientIdSaved(true);
    initOauth(trimmed);
  };

  const handleConnect = () => {
    setConnectErr("");
    setConnecting(true);
    try {
      oauthConnect();
    } catch (e) {
      setConnecting(false);
      setConnectErr(e.message);
    }
  };

  // Enrichissements lancés en arrière-plan après l'analyse principale : ils ne bloquent pas
  // l'affichage des résultats déjà disponibles, chacun a son propre indicateur de progression.
  const runComments = async (videos, apiKey) => {
    setCommentBusy(true);
    setCommentData(null);
    try {
      setCommentData(await analyseComments(videos, apiKey, { say: setCommentStep }));
    } catch (e) {
      // Bonus non bloquant : les chiffres principaux restent valables si ça échoue.
    } finally {
      setCommentBusy(false);
      setCommentStep("");
      refreshQuota();
    }
  };

  const runHooks = async (accessToken, videos) => {
    setHooksBusy(true);
    setHooksData(null);
    try {
      setHooksData(await fetchHooks(accessToken, videos, { say: setHooksStep }));
    } catch (e) {
      // Bonus non bloquant.
    } finally {
      setHooksBusy(false);
      setHooksStep("");
      refreshQuota();
    }
  };

  const runTrendSearch = async (q) => {
    if (!q?.trim() || trendBusy) return;
    setTrendBusy(true);
    setTrendErr("");
    try {
      const results = await searchTrending(q, key.trim());
      setTrendResults(results);
      setTrendQuery(q.trim());
    } catch (e) {
      setTrendErr(e.message);
    } finally {
      setTrendBusy(false);
      refreshQuota();
    }
  };

  const handleDisconnect = () => {
    oauthDisconnect();
    setConnectedChannel(null);
    setAnalytics(null);
    setVideoRevenue(null);
  };

  const run = async (url) => {
    const target = url || link;
    if (!target.trim() || busy) return;
    if (url) setLink(url);
    setBusy(true);
    setErr("");
    setRes(null);
    setTips(null);
    setTipsErr("");
    setAnalytics(null);
    setAnalyticsNote("");
    setVideoRevenue(null);
    setKeywordData(null);
    setTagData(null);
    setCommentData(null);
    setHooksData(null);
    setSnapshotDelta(null);
    setResB(null);
    setCompareErr("");
    try {
      const r = await analyse(target, key.trim(), setStep);
      setRes(r);
      const next = [
        { title: r.channel.title, url: "https://www.youtube.com/channel/" + r.channel.id },
        ...history.filter((h) => h.title !== r.channel.title),
      ].slice(0, 6);
      setHistory(next);
      try {
        localStorage.setItem(HISTORY_STORAGE, JSON.stringify(next));
      } catch (e) {}
      try {
        setTips(directives(r));
      } catch (e) {
        setTipsErr("Les directives n'ont pas pu être générées. Les chiffres ci-dessus restent valables.");
      }
      try {
        setKeywordData(keywordSignals(r.videos));
      } catch (e) {}
      try {
        setTagData(tagSignals(r.videos));
      } catch (e) {}
      runComments(r.videos, key.trim());
      try {
        const score = healthScore(r.stats);
        const prevSnap = lastSnapshot(r.channel.id);
        setSnapshotDelta(deltaSince(prevSnap, r, score));
        addSnapshot(r.channel.id, {
          title: r.channel.title,
          medViews: r.stats.medViews,
          portee: r.stats.portee,
          tendance: r.stats.tendance,
          engagement: r.stats.engagement,
          cadence: r.stats.cadence,
          regularite: r.stats.regularite,
          subs: r.channel.subs,
          score: score.total,
        });
        refreshTracked();
      } catch (e) {}
      if (connectedChannel && connectedChannel.id === r.channel.id) {
        const token = getValidToken();
        if (!token) {
          setAnalyticsNote("Ta connexion Google a expiré (environ 1 h) — clique de nouveau sur \"Connecter\" dans le panneau de gauche pour revoir tes revenus, CTR et rétention.");
        } else {
          try {
            setAnalytics(await fetchChannelAnalytics(token, r.channel.id));
          } catch (e) {
            setAnalyticsNote("Données privées indisponibles : " + e.message);
          }
          try {
            setVideoRevenue(await fetchVideoRevenue(token, r.channel.id));
          } catch (e) {
            // Le total sur la chaîne reste affiché même si la ventilation par vidéo échoue.
          }
          runHooks(token, r.videos);
        }
      } else if (connectedChannel) {
        setAnalyticsNote(
          `Connecté avec "${connectedChannel.title}" : les revenus/CTR/rétention n'apparaissent que pour cette chaîne, pas pour "${r.channel.title}".`
        );
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
      setStep("");
      refreshQuota();
    }
  };

  const runCompare = async (url) => {
    if (!url?.trim() || compareBusy) return;
    setCompareBusy(true);
    setCompareErr("");
    setCompareStep("");
    try {
      const r = await analyse(url, key.trim(), setCompareStep);
      setResB(r);
    } catch (e) {
      setCompareErr(e.message);
    } finally {
      setCompareBusy(false);
      setCompareStep("");
    }
  };

  return (
    <div
      style={{ background: C.paper, color: C.ink, fontFamily: SANS }}
      className="app-root w-full min-h-screen"
    >
      <div
        className="app-shell mx-auto grid"
        style={{ maxWidth: 1440, gridTemplateColumns: "340px 1fr", minHeight: "100vh" }}
      >
        {/* Panneau latéral : contrôles */}
        <aside style={{ borderRight: `1px solid ${C.line}`, background: C.panel }} className="p-6">
          <div style={{ borderBottom: `2px solid ${C.ink}` }} className="pb-4">
            <Eyebrow>Régie · analyse de chaîne</Eyebrow>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Colle un lien.
              <br />
              Lis le rythme.
            </h1>
            <p style={{ color: C.muted, fontSize: 12 }} className="mt-3 leading-relaxed">
              Données publiques uniquement, sauf connexion à ta propre chaîne. Toutes les vidéos sont analysées.
            </p>
          </div>

          <div className="mt-6">
            {!keySaved ? (
              <KeyForm onSave={saveKey} />
            ) : (
              <SearchBar
                link={link}
                setLink={setLink}
                onRun={run}
                busy={busy}
                history={history}
                onChangeKey={() => {
                  setKeySaved(false);
                  setKey("");
                }}
              />
            )}
          </div>

          {keySaved && (
            <ConnectChannel
              clientIdSaved={oauthClientIdSaved}
              onSaveClientId={saveClientId}
              oauthReady={oauthReady}
              connected={connectedChannel}
              connecting={connecting}
              connectErr={connectErr}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          )}

          {keySaved && res && (
            <CompareChannel
              onRun={runCompare}
              busy={compareBusy}
              step={compareStep}
              err={compareErr}
              resB={resB}
              onClear={() => setResB(null)}
            />
          )}

          {keySaved && (
            <TrendSearch
              onRun={runTrendSearch}
              busy={trendBusy}
              err={trendErr}
              hasResults={!!trendResults}
              onClear={() => setTrendResults(null)}
            />
          )}

          {keySaved && <QuotaMeter used={quotaUsed} />}

          {busy && (
            <div style={{ fontFamily: MONO, color: C.signal, fontSize: 12 }} className="mt-6">
              {step}
            </div>
          )}
          {err && (
            <div
              style={{ background: "#fff", borderLeft: `3px solid ${C.warn}`, borderRadius: 6, color: C.warn, fontSize: 13 }}
              className="mt-6 p-3 leading-relaxed"
            >
              {err}
            </div>
          )}
        </aside>

        {/* Contenu principal : résultats */}
        <main className="p-10">
          {!res && !busy && !err && !trendResults && (
            <div style={{ minHeight: 420 }} className="w-full h-full flex items-center justify-center">
              {trackedChannels.length ? (
                <TrackedChannels channels={trackedChannels} onSelect={(id) => run(id)} />
              ) : (
                <div style={{ color: C.muted, fontSize: 14 }} className="text-center">
                  Colle un lien de chaîne dans le panneau de gauche pour lancer une analyse.
                </div>
              )}
            </div>
          )}

          <TrendResults query={trendQuery} results={trendResults} />

          {res &&
            (() => {
              const navItems = [
                { id: "sec-score", label: "Score & rythme" },
                { id: "sec-stats", label: "Indicateurs" },
                analytics && { id: "sec-revenue", label: "Revenus" },
                hooksData?.length && { id: "sec-hooks", label: "Scripts" },
                resB && { id: "sec-compare", label: "Comparaison" },
                res.stats.historique.length >= 2 && { id: "sec-trend", label: "Tendance" },
                { id: "sec-keywords", label: "Mots-clés & tags" },
                commentData && { id: "sec-comments", label: "Commentaires" },
                { id: "sec-formats", label: "Formats & jours" },
                { id: "sec-directives", label: "Directives" },
                { id: "sec-topflop", label: "Top / Flop" },
                { id: "sec-videos", label: "Toutes les vidéos" },
              ].filter(Boolean);

              return (
                <div key={res.channel.id} className="fade-in">
                  <ErrorBoundary label="En-tête de chaîne">
                    <ChannelHeader
                      channel={res.channel}
                      actions={
                        <div className="flex gap-2">
                          <ExportButton channel={res.channel} videos={res.videos} />
                          <PrintButton />
                        </div>
                      }
                    />
                  </ErrorBoundary>
                  <SectionNav items={navItems} />
                  <ErrorBoundary label="Écart depuis la dernière analyse">
                    <SnapshotDelta delta={snapshotDelta} />
                  </ErrorBoundary>
                  <ErrorBoundary label="Score & rythme">
                    <div id="sec-score">
                      <HealthScore score={healthScore(res.stats)} />
                      <RhythmStrip videos={res.videos} medRythme={res.stats.medRythme} />
                    </div>
                  </ErrorBoundary>
                  <ErrorBoundary label="Indicateurs">
                    <div id="sec-stats">
                      <StatsGrid stats={res.stats} channel={res.channel} />
                      <AdvancedStats stats={res.stats} />
                    </div>
                  </ErrorBoundary>
                  {analyticsNote && (
                    <div style={{ color: C.muted, fontSize: 12 }} className="mt-4 leading-relaxed">
                      {analyticsNote}
                    </div>
                  )}
                  <ErrorBoundary label="Revenus">
                    <div id="sec-revenue">
                      <RevenueMetrics data={analytics} />
                    </div>
                  </ErrorBoundary>
                  <ErrorBoundary label="Scripts">
                    <div id="sec-hooks">
                      {hooksBusy && (
                        <div style={{ fontFamily: MONO, color: C.signal, fontSize: 12 }} className="mt-4">
                          {hooksStep || "Lecture des scripts…"}
                        </div>
                      )}
                      <HooksPanel hooks={hooksData} />
                    </div>
                  </ErrorBoundary>
                  <ErrorBoundary label="Comparaison">
                    <div id="sec-compare">
                      <CompareTable resA={res} resB={resB} />
                    </div>
                  </ErrorBoundary>
                  <ErrorBoundary label="Tendance">
                    <div id="sec-trend">
                      <TrendChart historique={res.stats.historique} />
                    </div>
                  </ErrorBoundary>
                  <ErrorBoundary label="Mots-clés & tags">
                    <div id="sec-keywords">
                      <KeywordSignals data={keywordData} />
                      <TagSignals data={tagData} />
                    </div>
                  </ErrorBoundary>
                  <ErrorBoundary label="Commentaires">
                    <div id="sec-comments">
                      {commentBusy && (
                        <div style={{ fontFamily: MONO, color: C.signal, fontSize: 12 }} className="mt-4">
                          {commentStep || "Lecture des commentaires…"}
                        </div>
                      )}
                      <CommentSignals data={commentData} />
                    </div>
                  </ErrorBoundary>
                  <ErrorBoundary label="Formats & jours">
                    <div id="sec-formats">
                      <FormatDayBreakdown stats={res.stats} />
                    </div>
                  </ErrorBoundary>
                  <ErrorBoundary label="Directives">
                    <div id="sec-directives">
                      <DirectivesList tips={tips} tipsErr={tipsErr} />
                    </div>
                  </ErrorBoundary>
                  <ErrorBoundary label="Top / Flop">
                    <div id="sec-topflop">
                      <TopFlopLists stats={res.stats} />
                    </div>
                  </ErrorBoundary>
                  <ErrorBoundary label="Toutes les vidéos">
                    <div id="sec-videos">
                      <VideoTable videos={res.videos} videoRevenue={videoRevenue} />
                    </div>
                  </ErrorBoundary>
                </div>
              );
            })()}
        </main>
      </div>
    </div>
  );
}
