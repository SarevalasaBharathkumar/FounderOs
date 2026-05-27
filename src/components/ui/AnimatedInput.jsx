"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion } from "framer-motion";

export default function AnimatedInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Describe your startup objective...",
  loading = false,
}) {
  const [displayPlaceholder, setDisplayPlaceholder] = useState(placeholder);
  const placeholderList = [
    "Describe your startup objective...",
    "What problem are you solving?",
    "Who is your target customer?",
    "What does success look like in 90 days?",
  ];

  useEffect(() => {
    setDisplayPlaceholder(placeholderList[Math.floor(Math.random() * placeholderList.length)]);
    const interval = window.setInterval(() => {
      setDisplayPlaceholder(placeholderList[Math.floor(Math.random() * placeholderList.length)]);
    }, 20000);
    return () => window.clearInterval(interval);
  }, []);

  const handleSubmit = () => {
    if (value.trim() && !loading) {
      onSubmit(value);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
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
