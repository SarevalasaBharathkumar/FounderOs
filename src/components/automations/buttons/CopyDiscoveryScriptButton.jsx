"use client";

import { useState } from "react";
import ActionButton from "../ActionButton";
import callOpenRouter from "../../../lib/openrouter";

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

function renderStructuredText(text) {
  return String(text || "")
    .split("\n")
    .map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={`gap-${idx}`} style={{ height: 8 }} />;
      if (/^\d+\./.test(trimmed)) {
        return <div key={`n-${idx}`} style={{ color: "#ffffff", fontWeight: 700, marginTop: 10 }}>{trimmed}</div>;
      }
      if (/^[-*]\s+/.test(trimmed)) {
        return <div key={`b-${idx}`} style={{ color: "#d4d4d8", marginLeft: 10, lineHeight: 1.6 }}>{`• ${trimmed.replace(/^[-*]\s+/, "")}`}</div>;
      }
      return <div key={`p-${idx}`} style={{ color: "#e4e4e7", lineHeight: 1.65 }}>{trimmed}</div>;
    });
}

function ScriptPreview({ text, onClose }) {
  const copyText = async () => {
    await navigator.clipboard.writeText(text || "");
  };

  const downloadText = () => {
    const blob = new Blob([text || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "discovery-script.txt";
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
          Discovery Call Script
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={copyText} style={modalButtonStyle}>📋 Copy Script</button>
          <button type="button" onClick={downloadText} style={modalButtonStyle}>⬇ Download</button>
          <button type="button" onClick={onClose} style={modalButtonStyle}>✕ Close</button>
        </div>
      </div>
      <div style={{ height: "calc(100vh - 60px)", overflowY: "auto", padding: 20, color: "#ffffff", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {renderStructuredText(text)}
      </div>
    </div>
  );
}

function CopyDiscoveryScriptButton({ data, objective }) {
  const [script, setScript] = useState(null);
  const [show, setShow] = useState(false);

  const handleClick = async () => {
    const result = await callOpenRouter({
      systemPrompt:
        "You are a customer discovery expert trained by Steve Blank and Rob Fitzpatrick (The Mom Test). Write discovery call scripts. Return clean plain text only.",
      userMessage: `
Startup: ${objective}
Critical assumptions to test: ${data?.criticalAssumptions?.join(", ")}
Biggest risk: ${data?.risks?.[0]?.risk}

Write a 15-minute customer discovery call script:
1. Opening (30 seconds) - how to introduce yourself
2. Warm-up questions (2 min) - about their current situation
3. Problem discovery (5 min) - 5 specific questions to test the assumptions above
4. Solution reaction (3 min) - how to describe the solution without pitching
5. Closing (2 min) - how to end and get a referral
6. Red flags to listen for
7. Green flags that validate the idea

Make every question specific to this startup's assumptions, not generic.
`,
    });

    const text = typeof result === "string" ? result : result?.content || "";
    setScript(text);
    setShow(true);
  };

  return (
    <>
      <ActionButton
        icon="🧪"
        label="Copy Discovery Script"
        doneLabel="Generated!"
        onClick={handleClick}
      />
      {show && <ScriptPreview text={script} onClose={() => setShow(false)} />}
    </>
  );
}

export default CopyDiscoveryScriptButton;
