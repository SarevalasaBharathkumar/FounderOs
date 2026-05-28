"use client";

import { useState } from "react";
import ActionButton from "../ActionButton";
import callOpenRouter from "../../../lib/openrouter";
import SimpleMarkdown from "../../ui/SimpleMarkdown";

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

function ChecklistPreview({ markdown, onClose }) {
  const copyText = async () => {
    await navigator.clipboard.writeText(markdown || "");
  };

  const downloadText = () => {
    const blob = new Blob([markdown || ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "validation-checklist.md";
    link.click();
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
          Validation Checklist
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={copyText} style={modalButtonStyle}>📋 Copy</button>
          <button type="button" onClick={downloadText} style={modalButtonStyle}>⬇ Download</button>
          <button type="button" onClick={onClose} style={modalButtonStyle}>✕ Close</button>
        </div>
      </div>
      <div style={{ height: "calc(100vh - 60px)", overflowY: "auto", padding: 20, color: "#ffffff", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        <SimpleMarkdown text={markdown} />
      </div>
    </div>
  );
}

function GenerateValidationChecklistButton({ data, objective }) {
  const [result, setResult] = useState(null);
  const [show, setShow] = useState(false);

  const handleClick = async () => {
    const response = await callOpenRouter({
      systemPrompt: "You are a startup validation expert. Create actionable checklists. Return clean markdown only.",
      userMessage: `
Objective: ${objective}
Critical assumptions: ${data?.criticalAssumptions?.join(", ")}
Blind spots: ${data?.blindSpots?.join(", ")}

Create a validation checklist with:
- One checkbox item per assumption
- Each item has: the assumption, how to test it, pass criteria (number), fail criteria
- Format: ## Assumption 1: [name]\n- [ ] Test: ...\n- Pass if: ...\n- Fail if: ...
- Include timeline: which week to test each assumption
- Final section: "If 3+ assumptions fail, consider these pivots: ..."
`,
    });

    const markdown = typeof response === "string" ? response : response?.content || "";
    setResult(markdown);
    setShow(true);
  };

  return (
    <>
      <ActionButton
        icon="✅"
        label="Generate Validation Checklist"
        doneLabel="Generated!"
        onClick={handleClick}
      />
      {show && <ChecklistPreview markdown={result} onClose={() => setShow(false)} />}
    </>
  );
}

export default GenerateValidationChecklistButton;
