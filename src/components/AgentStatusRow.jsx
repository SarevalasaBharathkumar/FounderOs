"use client";
import AGENTS from "../agents/registry";
import { FONTS, T } from "../styles/tokens";

function getBadge(status, color) {
  if (status === "running") {
    return {
      label: "LIVE",
      color,
      background: `${color}26`,
      prefix: "●",
      pulse: true,
    };
  }
  if (status === "done") {
    return {
      label: "DONE",
      color: T.green,
      background: `rgba(34,197,94,0.1)`,
      prefix: "✓",
      pulse: false,
    };
  }
  if (status === "error") {
    return {
      label: "ERR",
      color: T.red,
      background: `rgba(239,68,68,0.1)`,
      prefix: "",
      pulse: false,
    };
  }
  return {
    label: "IDLE",
    color: "#52525b",
    background: "rgba(255,255,255,0.04)",
    prefix: "",
    pulse: false,
  };
}

export default function AgentStatusRow({ agentStates }) {
  const cards = Object.values(AGENTS);

  return (
    <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px" }}>
      <style>{`
        @keyframes pulseLive {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .shimmer-effect::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: skewX(-20deg);
          animation: shimmer 1.5s infinite;
          pointer-events: none;
        }
      `}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {cards.map((agent) => {
          const state = agentStates?.[agent.id] || { status: "idle", data: null };
          const badge = getBadge(state.status, agent.color);
          
          let cardStyle = {
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "16px",
            padding: "1.2rem",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.3s ease",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          };

          // Apply state-specific styling
          if (state.status === "running") {
            cardStyle.borderColor = `${agent.color}66`;
            cardStyle.boxShadow = `0 0 30px ${agent.color}26`;
          } else if (state.status === "done") {
            cardStyle.borderColor = "rgba(34,197,94,0.3)";
            cardStyle.background = "rgba(34,197,94,0.04)";
          }

          return (
            <article
              key={agent.id}
              style={cardStyle}
              className={state.status === "running" ? "shimmer-effect" : ""}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <span style={{ fontSize: "1.4rem" }}>{agent.icon}</span>
                <span
                  style={{
                    borderRadius: "999px",
                    background: badge.background,
                    color: badge.color,
                    fontFamily: FONTS.sans,
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    padding: "3px 8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {badge.prefix && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                      }}
                    >
                      {badge.prefix === "●" && (
                        <span
                          style={{
                            width: "4px",
                            height: "4px",
                            borderRadius: "50%",
                            background: badge.color,
                            animation: badge.pulse ? "pulseLive 1.2s infinite" : "none",
                            display: "inline-block",
                          }}
                        />
                      )}
                      {badge.prefix !== "●" && badge.prefix}
                    </span>
                  )}
                  {badge.label}
                </span>
              </div>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "#ffffff",
                  marginTop: "0.75rem",
                }}
              >
                {agent.name}
              </div>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontWeight: 400,
                  fontSize: "0.72rem",
                  color: "#52525b",
                  lineHeight: 1.4,
                  marginTop: "2px",
                }}
              >
                {agent.role}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
