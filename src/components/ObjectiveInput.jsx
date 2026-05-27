"use client";
import { useEffect, useState } from "react";
import { FONTS, T } from "../styles/tokens";
import AnimatedInput from "./ui/AnimatedInput";

const PRESETS = [
  "Validate a niche AI support agent and get first 10 paid customers.",
  "Launch a B2B SaaS onboarding workflow with 20 pilot users in 30 days.",
  "Build an outbound motion for developer tools and close 3 design partners.",
  "Find PMF signals for a fintech app with retention-focused experiments.",
  "Create a GTM plan for a new productivity product for remote teams.",
];

export default function ObjectiveInput({ objective, setObjective, onLaunch, running }) {
  const [suggestion, setSuggestion] = useState(PRESETS[0]);

  useEffect(() => {
    const rotate = () => setSuggestion(PRESETS[Math.floor(Math.random() * PRESETS.length)]);
    rotate();
    const interval = window.setInterval(rotate, 20000);
    return () => window.clearInterval(interval);
  }, []);

  const rotateSuggestion = () => {
    setSuggestion((prev) => {
      const currentIndex = PRESETS.indexOf(prev);
      if (currentIndex < 0) return PRESETS[0];
      return PRESETS[(currentIndex + 1) % PRESETS.length];
    });
  };

  const handleSubmit = async () => {
    await onLaunch();
  };

  return (
    <section style={{ maxWidth: 860, margin: "26px auto 18px", padding: "0 16px", textAlign: "center" }}>
      <div style={{ color: T.dim, fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 0.6, marginBottom: 10 }}>
        Strategy · GTM · Outreach · Risk
      </div>
      <h1
        style={{
          margin: "0 0 10px",
          fontFamily: FONTS.sans,
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

      <AnimatedInput value={objective} onChange={setObjective} onSubmit={handleSubmit} loading={running} />

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={() => setObjective(suggestion)}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 999,
            padding: "8px 18px",
            fontFamily: FONTS.sans,
            fontSize: "0.8rem",
            color: "#71717a",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Suggestion: {suggestion}
        </button>
        <button
          type="button"
          onClick={rotateSuggestion}
          aria-label="Change suggestion"
          title="Change suggestion"
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.03)",
            color: "#71717a",
            cursor: "pointer",
            fontSize: "0.85rem",
            lineHeight: 1,
            display: "grid",
            placeItems: "center",
          }}
        >
          ↻
        </button>
      </div>
    </section>
  );
}
