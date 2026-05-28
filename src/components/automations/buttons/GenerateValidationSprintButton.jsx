"use client";

import { useState } from "react";
import ActionButton from "../ActionButton";
import callOpenRouter from "../../../lib/openrouter";
import SimpleMarkdown from "../../ui/SimpleMarkdown";

function ValidationSprintPreview({ markdown, onClose }) {
  const copyText = async () => {
    await navigator.clipboard.writeText(markdown || "");
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown || ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "validation-sprint.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.95)" }}>
      <div
        style={{
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          color: "#ffffff",
        }}
      >
        <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600 }}>
          7-Day Validation Sprint
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={copyText} style={modalButtonStyle}>Copy</button>
          <button type="button" onClick={downloadMarkdown} style={modalButtonStyle}>Download .md</button>
          <button type="button" onClick={onClose} style={modalButtonStyle}>Close</button>
        </div>
      </div>
      <div style={{ height: "calc(100vh - 60px)", overflowY: "auto", padding: 20, color: "#ffffff", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        <SimpleMarkdown text={markdown} />
      </div>
    </div>
  );
}

const modalButtonStyle = {
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 999,
  background: "rgba(255,255,255,0.06)",
  color: "#ffffff",
  padding: "6px 12px",
  cursor: "pointer",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontSize: "0.78rem",
};

function GenerateValidationSprintButton({ data, objective }) {
  const [result, setResult] = useState(null);
  const [show, setShow] = useState(false);

  const handleClick = async () => {
    const markdown = await callOpenRouter({
      systemPrompt: "You are a lean startup coach. Create a 7-day validation sprint plan. Return ONLY clean markdown, no code fences.",
      userMessage: `
Objective: ${objective}
Top risks to validate: ${Array.isArray(data?.risks) ? data.risks.map((r) => (typeof r === "string" ? r : r?.risk || r?.category || "")).filter(Boolean).join(", ") : ""}
Quick wins available: ${Array.isArray(data?.quickWins) ? data.quickWins.join(", ") : ""}
Phase 1 goal: ${data?.phases?.[0]?.goal || ""}

Create a 7-day validation sprint:
- Day 1-2: Customer Discovery (include 5 specific interview questions)
- Day 3-4: Landing Page Test (include the exact copy to use)  
- Day 5-6: Outreach Blitz (include exact message template)
- Day 7: Measure & Decide (include pass/fail criteria with numbers)

Make it specific to this startup, not generic advice.
`,
    });

    const text = typeof markdown === "string" ? markdown : markdown?.content || "";
    setResult(text);
    setShow(true);
  };

  return (
    <>
      <ActionButton icon="??" label="Generate Validation Sprint" doneLabel="Generated!" onClick={handleClick} />
      {show && <ValidationSprintPreview markdown={result} onClose={() => setShow(false)} />}
    </>
  );
}

export default GenerateValidationSprintButton;
