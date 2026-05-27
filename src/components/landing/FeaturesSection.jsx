"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function FeaturesSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const agents = [
    {
      icon: "⚡",
      title: "Execution Roadmap",
      description: "30-60-90 day phased plans with KPIs and quick wins",
      color: "#6366f1",
      outputs: ["Phase breakdown", "Task prioritization", "Success metrics", "Risk flags"],
    },
    {
      icon: "🎯",
      title: "Go-To-Market Strategy",
      description: "Customer segments, channels, pricing, and your first customer playbook",
      color: "#22c55e",
      outputs: ["Target segments", "Channel strategy", "Pricing tiers", "Positioning statement"],
    },
    {
      icon: "📨",
      title: "Outreach Campaigns",
      description: "Ready-to-send emails, LinkedIn messages, investor pitches, and Twitter threads",
      color: "#f59e0b",
      outputs: ["3-email sequence", "Investor pitch", "LinkedIn DM", "Twitter thread"],
    },
    {
      icon: "🛡️",
      title: "Risk Analysis",
      description: "Risk register with severity ratings, blind spots, and mitigation strategies",
      color: "#ef4444",
      outputs: ["Risk score", "Risk register", "Blind spots", "Runway advice"],
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
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "4rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
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
          FOUR AGENTS. ONE MISSION.
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
          Every dimension of your startup, covered.
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
          Each agent is a specialist. Together they cover everything a founding team needs.
        </p>
      </div>

      {/* Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2rem",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        {agents.map((agent, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
              border: `1px solid rgba(255,255,255,0.06)`,
              borderRadius: "20px",
              padding: "2rem",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            whileHover={{
              y: -4,
              borderColor: `${agent.color}4d`,
              boxShadow: `0 20px 60px ${agent.color}26`,
            }}
          >
            {/* Icon Circle */}
            <div
              style={{
                width: "64px",
                height: "64px",
                background: `${agent.color}1a`,
                border: `1px solid ${agent.color}33`,
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
                marginBottom: "1.5rem",
              }}
            >
              {agent.icon}
            </div>

            {/* Title */}
            <h3
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: "1.25rem",
                color: "#ffffff",
                margin: "0 0 0.75rem 0",
                lineHeight: 1.3,
              }}
            >
              {agent.title}
            </h3>

            {/* Description */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: "0.95rem",
                color: "#a1a1aa",
                lineHeight: 1.6,
                margin: "0 0 1.5rem 0",
              }}
            >
              {agent.description}
            </p>

            {/* Outputs List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {agent.outputs.map((output, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.78rem",
                    color: "#71717a",
                    lineHeight: 1.4,
                  }}
                >
                  <span
                    style={{
                      width: "4px",
                      height: "4px",
                      background: agent.color,
                      borderRadius: "50%",
                      flexShrink: 0,
                    }}
                  />
                  {output}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
