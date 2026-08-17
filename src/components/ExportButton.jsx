import { C, MONO } from "../theme";
import { toCSV } from "../lib/format";

export default function ExportButton({ channel, videos }) {
  const download = () => {
    const csv = toCSV(videos);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${channel.title.replace(/[^\w\-]+/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={download}
      style={{
        border: `1px solid ${C.line}`,
        color: C.muted,
        borderRadius: 6,
        fontFamily: MONO,
        fontSize: 11,
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
      }}
      className="px-3 py-1.5 uppercase no-print"
    >
      Exporter en CSV
    </button>
  );
}
