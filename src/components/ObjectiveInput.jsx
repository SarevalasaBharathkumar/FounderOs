"use client";
import { FONTS, T } from "../styles/tokens";

const PRESETS = [
  "Validate a niche AI support agent and get first 10 paid customers.",
  "Launch a B2B SaaS onboarding workflow with 20 pilot users in 30 days.",
  "Build an outbound motion for developer tools and close 3 design partners.",
  "Find PMF signals for a fintech app with retention-focused experiments.",
  "Create a GTM plan for a new productivity product for remote teams.",
];

export default function ObjectiveInput({ objective, setObjective, onLaunch, running }) {
  const canLaunch = !running && objective.trim().length > 0;

  const handleKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && canLaunch) {
      event.preventDefault();
      onLaunch();
    }
  };

  return (
    <section style={{ maxWidth: 860, margin: "26px auto 18px", padding: "0 16px", textAlign: "center" }}>
      <div style={{ color: T.dim, fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 0.6, marginBottom: 10 }}>
        Strategy · GTM · Outreach · Risk
      </div>
      <h1
        style={{
          margin: "0 0 10px",
          fontFamily: FONTS.display,
          fontSize: "clamp(30px, 5vw, 50px)",
          lineHeight: 1.06,
          background: `linear-gradient(90deg, ${T.text}, ${T.accent})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        Describe your startup objective.
      </h1>
      <p style={{ margin: "0 auto 18px", maxWidth: 680, color: T.dim, lineHeight: 1.5 }}>
        Launch your AI COO team to generate roadmap, go-to-market strategy, outreach assets, and risk register in one run.
      </p>

      <div style={{ position: "relative" }}>
        <textarea
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Example: Reach $10k MRR for a B2B AI workflow tool in 90 days."
          style={{
            width: "100%",
            minHeight: 168,
            resize: "vertical",
            borderRadius: 14,
            border: `1px solid ${T.border}`,
            background: T.surface,
            color: T.text,
            padding: "14px 14px 56px",
            outline: "none",
            fontSize: 15,
            lineHeight: 1.45,
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={onLaunch}
          disabled={!canLaunch}
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            height: 36,
            borderRadius: 10,
            border: "none",
            padding: "0 14px",
            cursor: canLaunch ? "pointer" : "not-allowed",
            background: canLaunch ? T.accent : T.surfaceAlt,
            color: canLaunch ? "#fff" : T.dim,
            fontFamily: FONTS.mono,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {running ? "Launching..." : "Launch (Cmd+Enter)"}
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 12 }}>
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setObjective(preset)}
            style={{
              borderRadius: 999,
              border: `1px solid ${T.border}`,
              background: T.surfaceAlt,
              color: T.dim,
              fontFamily: FONTS.mono,
              fontSize: 11,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            {preset}
          </button>
        ))}
      </div>
    </section>
  );
}
