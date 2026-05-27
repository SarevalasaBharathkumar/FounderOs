"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import AnimatedInput from "../ui/AnimatedInput";

export default function HeroSection({ onLaunch }) {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (value) => {
    setLoading(true);
    await onLaunch(value);
    setLoading(false);
    setInputValue("");
  };

  const fadeUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
  };

  const agentPills = [
    { icon: "⚡", label: "Strategy" },
    { icon: "🎯", label: "GTM" },
    { icon: "📨", label: "Outreach" },
    { icon: "🛡️", label: "Risk" },
  ];

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        overflow: "hidden",
        background: "#000000",
      }}
    >
      {/* Dark Radial Gradient Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 0%, black 70%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        {/* Badge Pill */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0 }}
          style={{
            border: "1px solid rgba(99,102,241,0.3)",
            background: "rgba(99,102,241,0.08)",
            borderRadius: "999px",
            padding: "6px 16px",
            fontSize: "0.75rem",
            color: "#818cf8",
            letterSpacing: "0.05em",
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontWeight: 600,
            textTransform: "uppercase",
            marginBottom: "1.5rem",
          }}
        >
          ⚡ AI-Powered Startup Operating System
        </motion.div>

        {/* H1 */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          style={{
            textAlign: "center",
            marginBottom: "1rem",
            maxWidth: "900px",
          }}
        >
          <h1
            style={{
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(3rem, 8vw, 6rem)",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              margin: 0,
              color: "#ffffff",
            }}
          >
            Your AI Chief{" "}
            <span style={{ color: "#818cf8" }}>Operating Officer</span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.2 }}
          style={{
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: "1rem",
            fontWeight: 400,
            color: "#a1a1aa",
            maxWidth: "480px",
            textAlign: "center",
            lineHeight: 1.6,
            marginBottom: "2rem",
            margin: 0,
            paddingBottom: "2rem",
          }}
        >
          4 specialized agents run in parallel — Strategy, GTM, Outreach, Risk.
          From objective to execution plan in under 60 seconds.
        </motion.p>

        {/* Animated Input */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.3 }}
          style={{
            maxWidth: "640px",
            width: "100%",
            marginBottom: "2.5rem",
          }}
        >
          <AnimatedInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </motion.div>

        {/* Agent Pills Row */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.4 }}
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "640px",
          }}
        >
          {agentPills.map((pill) => (
            <div
              key={pill.label}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "999px",
                padding: "4px 12px",
                fontSize: "0.72rem",
                color: "#71717a",
                fontFamily:
                  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {pill.icon} {pill.label}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
