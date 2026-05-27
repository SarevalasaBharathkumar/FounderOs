"use client";
import AGENTS from "../agents/registry";
import { FONTS, T } from "../styles/tokens";

function getBadge(status, color) {
  if (status === "running") {
    return {
      label: "LIVE",
      color,
      background: `${color}1f`,
      border: color,
      pulse: true,
    };
  }
  if (status === "done") {
    return {
      label: "DONE",
      color: T.green,
      background: `${T.green}1f`,
      border: T.green,
      pulse: false,
    };
  }
  if (status === "error") {
    return {
      label: "ERR",
      color: T.red,
      background: `${T.red}1f`,
      border: T.red,
      pulse: false,
    };
  }
  return {
    label: "IDLE",
    color: T.dim,
    background: T.surfaceAlt,
    border: T.border,
    pulse: false,
  };
}

export default function AgentStatusRow({ agentStates }) {
  const cards = Object.values(AGENTS);

  return (
    <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px" }}>
      <style>{`@keyframes pulseLive { 0% { opacity: 0.75; transform: scale(0.94); } 50% { opacity: 1; transform: scale(1); } 100% { opacity: 0.75; transform: scale(0.94); } }`}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        {cards.map((agent) => {
          const state = agentStates?.[agent.id] || { status: "idle", data: null };
          const badge = getBadge(state.status, agent.color);
          const glow = state.status === "running" || state.status === "done";

          return (
            <article
              key={agent.id}
              style={{
                "--agent-color": agent.color,
                borderRadius: 12,
                border: `1px solid ${glow ? "var(--agent-color)" : T.border}`,
                background: T.surface,
                boxShadow: glow ? `0 0 0 1px ${agent.color}2e, 0 0 16px ${agent.color}20` : "none",
                padding: 12,
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 18 }}>{agent.icon}</span>
                <span
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${badge.border}`,
                    background: badge.background,
                    color: badge.color,
                    fontFamily: FONTS.mono,
                    fontSize: 11,
                    padding: "3px 7px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {badge.pulse ? (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: badge.color,
                        animation: "pulseLive 1.2s infinite",
                      }}
                    />
                  ) : null}
                  {badge.label}
                </span>
              </div>
              <div style={{ color: T.text, fontFamily: FONTS.display, fontWeight: 700 }}>{agent.name}</div>
              <div style={{ color: T.dim, fontSize: 13, lineHeight: 1.4 }}>{agent.role}</div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
