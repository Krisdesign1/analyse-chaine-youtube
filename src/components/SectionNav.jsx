import { C, MONO } from "../theme";

export default function SectionNav({ items }) {
  if (!items.length) return null;

  const jump = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className="no-print flex flex-wrap gap-2 sticky top-0 z-10 py-3 mb-2"
      style={{ background: C.paper, borderBottom: `1px solid ${C.line}` }}
    >
      {items.map((it) => (
        <a
          key={it.id}
          href={`#${it.id}`}
          onClick={(e) => jump(e, it.id)}
          style={{
            border: `1px solid ${C.line}`,
            borderRadius: 999,
            color: C.muted,
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: "0.04em",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
          className="px-3 py-1.5 uppercase"
        >
          {it.label}
        </a>
      ))}
    </nav>
  );
}
