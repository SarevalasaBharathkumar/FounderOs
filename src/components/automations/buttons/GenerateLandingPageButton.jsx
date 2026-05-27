"use client";

import { useState } from "react";
import ActionButton from "../ActionButton";
import callOpenRouter from "../../../lib/openrouter";

function LandingPagePreview({ html, onClose }) {
  const copyHtml = async () => {
    await navigator.clipboard.writeText(html || "");
  };

  const downloadHtml = () => {
    const blob = new Blob([html || ""], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "landing-page.html";
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
          Generated Landing Page
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={copyHtml} style={previewButtonStyle}>Copy HTML</button>
          <button type="button" onClick={downloadHtml} style={previewButtonStyle}>Download</button>
          <button type="button" onClick={onClose} style={previewButtonStyle}>Close</button>
        </div>
      </div>
      <iframe
        title="Landing Page Preview"
        srcDoc={html}
        style={{ width: "100%", height: "calc(100vh - 60px)", border: "none", background: "white" }}
      />
    </div>
  );
}

const previewButtonStyle = {
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 999,
  background: "rgba(255,255,255,0.06)",
  color: "#ffffff",
  padding: "6px 12px",
  cursor: "pointer",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontSize: "0.78rem",
};

function GenerateLandingPageButton({ data, objective }) {
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleClick = async () => {
    const generatedHTML = await callOpenRouter({
      systemPrompt:
        "You are an expert web developer. Generate a complete, beautiful, single-file HTML landing page. Return ONLY the raw HTML - no explanation, no markdown fences, just the HTML starting with <!DOCTYPE html>. The page must be fully self-contained with CSS in a <style> tag. No external dependencies except Google Fonts.",
      userMessage: `
Create a landing page for this startup:

Objective: ${objective}
Positioning: ${data?.positioningStatement}
Target Customer: ${data?.targetSegments?.[0]?.segment}
Their Pain: ${data?.targetSegments?.[0]?.pain}
Top Channels: ${data?.channels?.slice(0, 2).map((c) => c.name).join(", ")}
Pricing Model: ${data?.pricingStrategy?.model}
Pricing Tiers: ${data?.pricingStrategy?.tiers?.join(", ")}

Design requirements:
- Dark background (#0a0a0a), white text
- Accent color: #6366f1 (indigo)
- Google Font: Inter
- Sections: Hero (headline + subheadline + email capture form),
  Features (3 features from the channels/benefits),
  Pricing (the tiers above),
  Simple footer
- Mobile responsive using CSS flexbox/grid
- Hero CTA button: "Get Early Access"
- Email input: placeholder "Enter your email"
- Make it look like a real YC startup landing page
`,
    });

    const htmlText = typeof generatedHTML === "string" ? generatedHTML : generatedHTML?.content || "";
    setPreview(htmlText);
    setShowPreview(true);
  };

  return (
    <>
      <ActionButton icon="🚀" label="Generate Landing Page" doneLabel="Generated!" onClick={handleClick} />
      {showPreview && <LandingPagePreview html={preview} onClose={() => setShowPreview(false)} />}
    </>
  );
}

export default GenerateLandingPageButton;
