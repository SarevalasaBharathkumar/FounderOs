"use client";
import { motion } from "framer-motion";

export default function CTASection({ onGetStarted }) {
  const fadeUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
  };

  return (
    <section
      style={{
        position: "relative",
        padding: "8rem 2rem",
        overflow: "hidden",
        textAlign: "center",
        background: "#000000",
      }}
    >
      {/* Radial Glow Background */}
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {/* H2 */}
        <motion.h2
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0 }}
          style={{
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            color: "#ffffff",
            letterSpacing: "-0.04em",
            margin: "0 0 1rem 0",
            lineHeight: 1.2,
          }}
        >
          Start building like a team of ten.
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "1rem",
            fontWeight: 400,
            color: "#a1a1aa",
            lineHeight: 1.6,
            margin: "0 0 2.5rem 0",
          }}
        >
          One objective. Four agents. Complete execution plan.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.2 }}
          onClick={onGetStarted}
          style={{
            background: "#ffffff",
            color: "#000000",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            padding: "1rem 2.5rem",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 0 60px rgba(99,102,241,0.3)",
            marginBottom: "1.5rem",
          }}
          whileHover={{ backgroundColor: "#f4f4f5", scale: 1.02 }}
        >
          Launch FounderOS →
        </motion.button>

        {/* Sub-text */}
        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.3 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.75rem",
            color: "#52525b",
            margin: 0,
            letterSpacing: "0.02em",
          }}
        >
          No signup required. Works in your browser.
        </motion.p>
      </div>
    </section>
  );
}
