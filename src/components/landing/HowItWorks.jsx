"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const steps = [
    {
      icon: "✍️",
      title: "Describe Your Objective",
      desc: "Type your startup goal in plain language. Be as specific or broad as you want.",
    },
    {
      icon: "⚡",
      title: "Agents Activate in Parallel",
      desc: "All 4 AI agents fire simultaneously — no waiting for one to finish before the next starts.",
    },
    {
      icon: "📊",
      title: "Review Your Complete Plan",
      desc: "Get a 90-day roadmap, GTM strategy, outreach campaigns, and risk analysis in one dashboard.",
    },
    {
      icon: "🚀",
      title: "Execute Like a Team",
      desc: "Check off tasks, push back on agents, regenerate sections, and track progress in your Founder Memory.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section
      ref={sectionRef}
      style={{
        background: "#000000",
        padding: "6rem 2rem",
        textAlign: "center",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "4rem", maxWidth: "800px", margin: "0 auto" }}>
        {/* Eyebrow */}
        <div
          style={{
            fontSize: "0.72rem",
            letterSpacing: "0.15em",
            color: "#6366f1",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          HOW IT WORKS
        </div>

        {/* H2 */}
        <h2
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            color: "#ffffff",
            letterSpacing: "-0.03em",
            margin: "0 0 1rem 0",
            lineHeight: 1.2,
          }}
        >
          From idea to execution plan
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "1rem",
            fontWeight: 400,
            color: "#a1a1aa",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Describe your objective once. Four AI agents handle the rest.
        </p>
      </div>

      {/* Steps Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
              padding: "2rem",
              position: "relative",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            whileHover={{ borderColor: "rgba(99,102,241,0.3)", boxShadow: "0 0 40px rgba(99,102,241,0.08)", y: -2 }}
          >
            {/* Step Number */}
            <div
              style={{
                position: "absolute",
                top: "1.5rem",
                right: "1.5rem",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 900,
                fontSize: "4rem",
                color: "rgba(255,255,255,0.03)",
                lineHeight: 1,
                margin: 0,
              }}
            >
              {String(idx + 1).padStart(2, "0")}
            </div>

            {/* Icon Circle */}
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.3rem",
                marginBottom: "1rem",
              }}
            >
              {step.icon}
            </div>

            {/* Title */}
            <h3
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "#ffffff",
                margin: "1rem 0 0.5rem 0",
                lineHeight: 1.3,
              }}
            >
              {step.title}
            </h3>

            {/* Description */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: "0.85rem",
                color: "#71717a",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {step.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
