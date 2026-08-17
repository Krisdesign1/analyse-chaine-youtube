import { C, MONO } from "../theme";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
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
      Exporter en PDF
    </button>
  );
}
