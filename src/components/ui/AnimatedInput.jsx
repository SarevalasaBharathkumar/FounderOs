"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion } from "framer-motion";

export default function AnimatedInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Describe your idea...",
  loading = false,
}) {
  void placeholder;
  const TYPING_PLACEHOLDER = "Describe your idea...";
  const [displayPlaceholder, setDisplayPlaceholder] = useState("");

  useEffect(() => {
    let charIndex = 0;
    let forward = true;

    const interval = window.setInterval(() => {
      if (forward) {
        charIndex += 1;
        if (charIndex >= TYPING_PLACEHOLDER.length) {
          forward = false;
        }
      } else {
        charIndex -= 1;
        if (charIndex <= 0) {
          forward = true;
        }
      }
      setDisplayPlaceholder(TYPING_PLACEHOLDER.slice(0, Math.max(0, charIndex)));
    }, 85);

    return () => window.clearInterval(interval);
  }, []);

  const handleSubmit = () => {
    if (value.trim() && !loading) {
      onSubmit(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "100%",
      }}
    >
      {/* Gradient border wrapper */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))",
          padding: "1px",
          borderRadius: "17px",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={displayPlaceholder}
        style={{
          width: "100%",
          minHeight: "120px",
          background: "rgba(10,10,10,0.8)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          backdropFilter: "blur(20px)",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: "1rem",
          color: "#ffffff",
          padding: "1.2rem 1.2rem 3.5rem 1.2rem",
          resize: "vertical",
          boxSizing: "border-box",
          transition: "all 200ms ease",
          outline: "none",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "rgba(99,102,241,0.5)";
          e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "rgba(255,255,255,0.08)";
          e.target.style.boxShadow = "none";
        }}
      />

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || loading}
        style={{
          position: "absolute",
          bottom: "0.75rem",
          right: "0.75rem",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "#ffffff",
          color: "#000000",
          border: "none",
          cursor: !value.trim() || loading ? "not-allowed" : "pointer",
          opacity: !value.trim() || loading ? 0.5 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "opacity 200ms ease",
          padding: 0,
        }}
      >
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                border: "2px solid #000000",
                borderTop: "2px solid transparent",
                borderRadius: "50%",
              }}
            />
          </motion.div>
        ) : (
          <ArrowUp size={20} strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
}
