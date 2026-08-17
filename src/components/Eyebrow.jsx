import { C, MONO } from "../theme";

export default function Eyebrow({ children }) {
  return (
    <div
      style={{ fontFamily: MONO, color: C.muted, letterSpacing: "0.18em", fontSize: 10 }}
      className="uppercase mb-3"
    >
      {children}
    </div>
  );
}
