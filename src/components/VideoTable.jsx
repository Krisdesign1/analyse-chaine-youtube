import { useEffect, useMemo, useState } from "react";
import { C, MONO } from "../theme";
import Eyebrow from "./Eyebrow";
import { compact, fmt } from "../lib/format";

const PAGE_SIZE = 50;

const BASE_COLUMNS = [
  { key: "date", label: "Date", align: "left" },
  { key: "title", label: "Titre", align: "left" },
  { key: "format", label: "Format", align: "right" },
  { key: "sec", label: "Durée", align: "right" },
  { key: "views", label: "Vues", align: "right" },
  { key: "rythme", label: "Vues/j", align: "right" },
  { key: "likes", label: "Likes", align: "right" },
  { key: "comments", label: "Comm.", align: "right" },
];
const REVENUE_COLUMN = { key: "revenue", label: "Revenus", align: "right" };

const cell = (v) => (v == null ? "" : v);

export default function VideoTable({ videos, videoRevenue }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);
  const [printing, setPrinting] = useState(false);

  const hasRevenue = !!videoRevenue && Object.keys(videoRevenue).length > 0;
  const columns = hasRevenue ? [...BASE_COLUMNS, REVENUE_COLUMN] : BASE_COLUMNS;

  // Le tableau est paginé à l'écran pour rester lisible, mais l'impression/export PDF doit
  // contenir toutes les vidéos : on bascule temporairement en affichage complet le temps
  // de l'impression, puis on restaure la pagination normale ensuite.
  useEffect(() => {
    const onBeforePrint = () => setPrinting(true);
    const onAfterPrint = () => setPrinting(false);
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);

  const withRevenue = useMemo(() => {
    if (!hasRevenue) return videos;
    return videos.map((v) => ({ ...v, revenue: videoRevenue[v.id]?.estimatedRevenue ?? null }));
  }, [videos, videoRevenue, hasRevenue]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? withRevenue.filter((v) => v.title.toLowerCase().includes(q)) : withRevenue;
    return [...list].sort((a, b) => {
      const av = sortKey === "date" ? new Date(a.date).getTime() : sortKey === "title" ? a.title : a[sortKey];
      const bv = sortKey === "date" ? new Date(b.date).getTime() : sortKey === "title" ? b.title : b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [withRevenue, query, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const rows = printing ? filtered : filtered.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
    setPage(0);
  };

  return (
    <div className="mt-10">
      <Eyebrow>
        Toutes les vidéos ({filtered.length}
        {filtered.length !== videos.length ? ` / ${videos.length}` : ""})
        {hasRevenue ? " · revenus par vidéo inclus" : ""}
      </Eyebrow>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(0);
        }}
        placeholder="Filtrer par titre…"
        style={{
          background: "#fff",
          color: C.onLight,
          border: `1px solid ${C.line}`,
          borderRadius: 6,
          fontFamily: MONO,
          fontSize: 12,
        }}
        className="w-full px-3 py-2 outline-none mb-2 no-print"
      />
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }}>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    color: sortKey === c.key ? C.signal : C.muted,
                    textAlign: c.align,
                    padding: "8px 10px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                  className="uppercase select-none"
                >
                  {c.label}
                  {sortKey === c.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                <td style={{ padding: "6px 10px", fontFamily: MONO, color: C.muted, whiteSpace: "nowrap" }}>
                  {new Date(v.date).toLocaleDateString("fr-FR")}
                </td>
                <td
                  style={{
                    padding: "6px 10px",
                    maxWidth: 420,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={v.title}
                >
                  {cell(v.title)}
                </td>
                <td style={{ padding: "6px 10px", textAlign: "right", color: C.muted }}>{v.format}</td>
                <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: MONO }}>
                  {Math.floor(v.sec / 60)}:{String(v.sec % 60).padStart(2, "0")}
                </td>
                <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: MONO }}>{compact(v.views)}</td>
                <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: MONO, color: C.signal }}>
                  {compact(v.rythme)}
                </td>
                <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: MONO }}>{compact(v.likes)}</td>
                <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: MONO }}>{compact(v.comments)}</td>
                {hasRevenue && (
                  <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: MONO, color: C.good }}>
                    {v.revenue == null ? "—" : "$" + fmt(v.revenue)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div
          className="flex items-center justify-between mt-2 no-print"
          style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}
        >
          <button
            onClick={() => setPage(Math.max(0, clampedPage - 1))}
            disabled={clampedPage === 0}
            className="disabled:opacity-30"
          >
            ← précédent
          </button>
          <span>
            page {clampedPage + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage(Math.min(pageCount - 1, clampedPage + 1))}
            disabled={clampedPage >= pageCount - 1}
            className="disabled:opacity-30"
          >
            suivant →
          </button>
        </div>
      )}
    </div>
  );
}
