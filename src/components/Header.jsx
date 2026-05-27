"use client";
import { FONTS, T } from "../styles/tokens";

export default function Header({ onLogoClick, onToggleMemory }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 60,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: "rgba(10,11,15,0.7)",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <style>{`@keyframes pulseDot { 0% { transform: scale(0.92); opacity: 0.8; } 50% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.92); opacity: 0.8; } }`}</style>
      <div
        style={{
          height: "100%",
          maxWidth: 1180,
          margin: "0 auto",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          type="button"
          onClick={onLogoClick}
          style={{ display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: "grid",
              placeItems: "center",
              background: T.accent,
              color: "#fff",
              fontFamily: FONTS.sans,
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            F
          </div>
          <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, fontSize: 18 }}>FounderOS</div>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={onToggleMemory}
            style={{
              border: `1px solid ${T.border}`,
              background: T.surfaceAlt,
              color: T.dim,
              borderRadius: 999,
              padding: "5px 10px",
              fontFamily: FONTS.mono,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            ⚡ Memory
          </button>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: T.green,
              boxShadow: `0 0 10px ${T.green}`,
              animation: "pulseDot 1.4s infinite",
            }}
          />
          <span style={{ color: T.dim, fontFamily: FONTS.mono, fontSize: 12 }}>AI COO · 4 Agents Online</span>
        </div>
      </div>
    </header>
  );
}
