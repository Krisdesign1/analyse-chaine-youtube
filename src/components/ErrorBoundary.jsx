import { Component } from "react";
import { C, MONO } from "../theme";

/* Isole une section : si son rendu plante (donnée inattendue, cas limite non prévu),
   seule cette section affiche un message d'erreur — le reste de la page reste utilisable
   au lieu de devenir blanche entièrement. Doit être une classe : React n'expose pas
   getDerivedStateFromError/componentDidCatch via les hooks. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Section en erreur :", this.props.label || "(sans nom)", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{ background: "#fff", borderLeft: `3px solid ${C.warn}`, borderRadius: 6, color: C.warn, fontSize: 13 }}
          className="p-4 my-4"
        >
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em" }} className="uppercase mb-1">
            {this.props.label ? `${this.props.label} — section en erreur` : "Section en erreur"}
          </div>
          <div style={{ fontSize: 12 }}>
            {this.state.error.message || "Un problème inattendu est survenu."} Le reste de la page reste valable.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
