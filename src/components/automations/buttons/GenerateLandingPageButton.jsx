"use client";

import { useRef, useState } from "react";
import ActionButton from "../ActionButton";
import callOpenRouter from "../../../lib/openrouter";
import DeployToVercelButton from "./DeployToVercelButton";

const LANDING_PAGE_SYSTEM_PROMPT = `You are a world-class UI designer 
who has designed landing pages for Linear, Vercel, Raycast, and Loom.
Generate a complete, beautiful, production-ready single-file HTML landing page.
Return ONLY raw HTML starting with <!DOCTYPE html>. Nothing else.

CRITICAL DESIGN RULES — breaking any of these is failure:

SPACING:
- Section padding: max 80px top/bottom. Never more.
- Gap between elements within a section: 16-24px
- Hero to next section gap: 0px (sections flow directly)
- No empty space that serves no purpose

TYPOGRAPHY:
- Hero headline: 64-72px, font-weight 800, letter-spacing -0.04em, line-height 1
- Subheadline: 18px, font-weight 400, color rgba(255,255,255,0.6), max-width 480px
- Section headline: 36-42px, font-weight 700, letter-spacing -0.03em
- Body text: 15-16px, line-height 1.6, color rgba(255,255,255,0.65)
- ALL text is specific to the startup — zero generic placeholders

COLORS:
- Background: #000000
- Surface: #0a0a0a, cards: #111111
- Borders: rgba(255,255,255,0.08)
- Accent: #6366f1
- CTA button: linear-gradient(135deg, #6366f1, #8b5cf6)
  box-shadow: 0 0 40px rgba(99,102,241,0.4) on hover

SECTIONS — all required, in this order:
1. NAVBAR: Fixed, blur backdrop, logo left + 3 nav links + CTA button right
   height 60px, border-bottom rgba(255,255,255,0.06)

2. HERO: min-height 100vh, flex center
   - A badge pill above headline: accent color, small text
   - H1: 2-3 words maximum, huge, gradient text (white to rgba(255,255,255,0.7))
   - Subheadline: 1-2 sentences, specific benefit
   - Email + CTA row: email input (dark, rounded-full) + gradient button side by side
   - Under input: "No credit card required · Free 14-day trial" in tiny muted text
   - Background: radial gradient glow behind text (rgba(99,102,241,0.15) centered)

3. LOGOS STRIP: "Trusted by teams at" + 5 fake company names in muted text
   padding 24px 0, border-top and border-bottom rgba(255,255,255,0.06)

4. FEATURES: 3-column grid
   Each card: background #111, border rgba(255,255,255,0.06), border-radius 16px
   padding 28px, icon (emoji, 32px), title (Inter 600, 18px), 
   description (15px, 1.6 line-height, muted)
   On hover: border-color rgba(99,102,241,0.3), transform translateY(-4px)
   transition: all 0.2s ease

5. SOCIAL PROOF: Dark background, 3 testimonial cards side by side
   Each: quote text + name + role + company
   Make names and quotes specific and credible

6. PRICING: 3 tiers from the data
   Cards side by side, middle one: border #6366f1, badge "Most Popular"
   Price: large number + /month
   Feature list with checkmarks
   CTA button per tier

7. FINAL CTA: Centered, large headline, email capture, button
   Background: subtle gradient or pattern

8. FOOTER: Single row, logo + links + copyright. Clean and minimal.

INTERACTIONS:
- All buttons: cursor pointer, transition 0.2s
- Hover states on every interactive element
- Smooth scroll: scroll-behavior: smooth on html

FONTS: Load Inter from Google Fonts in <head>
RESPONSIVE: All sections work on mobile (use CSS Grid with auto-fit)
SELF-CONTAINED: Zero external dependencies except Google Fonts`;

function GenerateLandingPageButton({ data, objective }) {
  const [versions, setVersions] = useState([]);
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [editMode, setEditMode] = useState(false);
  const editInputRef = useRef(null);

  const activeVersion = versions[activeVersionIndex];

  const getSafePreviewHtml = (rawHtml) => {
    if (!rawHtml) return "";
    const withoutScripts = rawHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    const lockInteractionsCss = `
<style>
  a, button, [role="button"], input, textarea, select, form { pointer-events: none !important; }
</style>`;
    if (withoutScripts.includes("</head>")) {
      return withoutScripts.replace("</head>", `${lockInteractionsCss}</head>`);
    }
    if (withoutScripts.includes("<body")) {
      return withoutScripts.replace(/<body([^>]*)>/i, `<body$1>${lockInteractionsCss}`);
    }
    return `${withoutScripts}\n${lockInteractionsCss}`;
  };

  const callModel = async (systemPrompt, userMessage) => {
    const result = await callOpenRouter({ systemPrompt, userMessage });
    return typeof result === "string" ? result : result?.content || "";
  };

  async function generateLandingPage(prompt, isEdit = false) {
    setGenerating(true);

    try {
      const userMessage = isEdit
        ? `Current landing page HTML:
${versions[activeVersionIndex]?.html}

The founder wants these changes:
"${prompt}"

Update ONLY the parts explicitly requested above.
Do not redesign, reorder, or rewrite untouched sections.
Preserve existing structure, wording, spacing system, and styling unless explicitly requested.
Return the full updated HTML as a minimal targeted revision.

Startup context:
Objective: ${objective}
Positioning: ${data.positioningStatement}
Pricing: ${data.pricingStrategy?.tiers?.join(", ")}`
        : `Create a landing page for this startup:

Objective: ${objective}
Positioning: ${data.positioningStatement}
Target Customer: ${data.targetSegments?.[0]?.segment}
Their Main Pain: ${data.targetSegments?.[0]?.pain}
Top Value Prop: ${data.channels?.[0]?.tactic}
Pricing Model: ${data.pricingStrategy?.model}
Pricing Tiers: ${data.pricingStrategy?.tiers?.join(", ")}
First Customer Strategy: ${data.firstCustomerPlaybook?.[0]}

Make every word specific to this startup. Zero placeholder content.`;

      const html = await callModel(LANDING_PAGE_SYSTEM_PROMPT, userMessage);

      const newVersion = {
        html,
        prompt: isEdit ? prompt : "Initial generation",
        ts: Date.now(),
        label: isEdit ? `Edit: "${prompt.slice(0, 40)}..."` : "v1 — Original",
      };

      setVersions((prev) => {
        const updated = [newVersion, ...prev];
        return updated.map((v, i) => ({
          ...v,
          label: i === 0 ? (isEdit ? `v${updated.length}: "${prompt.slice(0, 30)}..."` : "v1 — Original") : v.label,
        }));
      });
      setActiveVersionIndex(0);
      setEditMode(false);
      setEditPrompt("");
      setShowPreview(true);
    } finally {
      setGenerating(false);
    }
  }

  const downloadHtml = () => {
    const blob = new Blob([activeVersion?.html || ""], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "landing-page.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const canApplyEdit = editPrompt.trim() && !generating;
  const versionButtons = versions.slice(0, 5);

  return (
    <>
      <ActionButton
        icon="🚀"
        label={versions.length > 0 ? "Open Landing Page" : "Generate Landing Page"}
        loading={generating && !showPreview}
        doneLabel="Generated!"
        onClick={() => (versions.length > 0 ? setShowPreview(true) : generateLandingPage("", false))}
      />

      {showPreview && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#000" }}>
          <style>{`
            @keyframes spinLandingPage {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>

          <div
            style={{
              height: 56,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.95)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 1.5rem",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: "0.85rem", color: "#ffffff" }}>
                Landing Page
              </span>
              <span
                style={{
                  background: "rgba(99,102,241,0.1)",
                  color: "#818cf8",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 999,
                  padding: "2px 10px",
                  fontSize: "0.7rem",
                  whiteSpace: "nowrap",
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                }}
              >
                {activeVersion?.label || "v1"}
              </span>
            </div>

            {versions.length > 1 ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center", flex: 1, justifyContent: "center" }}>
                {versionButtons.map((version, index) => {
                  const realIndex = index;
                  const isActive = realIndex === activeVersionIndex;
                  return (
                    <button
                      key={`${version.ts}-${index}`}
                      type="button"
                      onClick={() => setActiveVersionIndex(realIndex)}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${isActive ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: "0.7rem",
                        cursor: "pointer",
                        color: isActive ? "#818cf8" : "#a1a1aa",
                      }}
                    >
                      {`v${versions.length - realIndex}`}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ flex: 1 }} />
            )}

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => {
                  setEditMode(true);
                  setTimeout(() => editInputRef.current?.focus(), 0);
                }}
                style={topPillActionStyle("rgba(99,102,241,0.08)", "rgba(99,102,241,0.2)", "#818cf8")}
              >
                ✏️ Request Changes
              </button>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(activeVersion?.html || "")}
                style={topPillActionStyle()}
              >
                📋 Copy HTML
              </button>
              <button type="button" onClick={downloadHtml} style={topPillActionStyle()}>
                ⬇️ Download
              </button>
              <DeployToVercelButton
                html={activeVersion?.html || ""}
                startupName={objective.split(" ").slice(0, 3).join("-").toLowerCase()}
              />
              <button type="button" onClick={() => setShowPreview(false)} style={topPillActionStyle()}>
                Exit to App
              </button>
              <button type="button" onClick={() => setShowPreview(false)} style={topPillActionStyle()}>
                ✕
              </button>
            </div>
          </div>

          {editMode && (
            <div
              style={{
                background: "rgba(99,102,241,0.06)",
                borderBottom: "1px solid rgba(99,102,241,0.15)",
                padding: "12px 1.5rem",
                display: "grid",
                gap: 8,
                transform: "translateY(0)",
                transition: "transform 0.2s ease",
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 500, fontSize: "0.8rem", color: "#a1a1aa", whiteSpace: "nowrap" }}>
                  ✏️ Describe your changes:
                </div>
                <input
                  ref={editInputRef}
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editPrompt.trim()) {
                      generateLandingPage(editPrompt, true);
                    }
                  }}
                  placeholder="e.g. Make the hero headline bigger, change pricing to monthly..."
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "white",
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  disabled={!canApplyEdit}
                  onClick={() => generateLandingPage(editPrompt, true)}
                  style={{
                    background: "#6366f1",
                    color: "white",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    border: "1px solid #6366f1",
                    cursor: canApplyEdit ? "pointer" : "not-allowed",
                    opacity: canApplyEdit ? 1 : 0.5,
                  }}
                >
                  Apply Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setEditPrompt("");
                  }}
                  style={{
                    background: "transparent",
                    color: "#a1a1aa",
                    borderRadius: 8,
                    padding: "8px 12px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
              <div style={{ fontSize: "0.7rem", color: "#52525b", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                Tip: Be specific. "Make the pricing section show annual/monthly toggle" works better than "improve pricing"
              </div>
            </div>
          )}

          <div style={{ position: "relative", height: editMode ? "calc(100vh - 56px - 84px)" : "calc(100vh - 56px)" }}>
            {generating ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.85)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    border: "3px solid rgba(99,102,241,0.2)",
                    borderTopColor: "#6366f1",
                    borderRadius: "50%",
                    animation: "spinLandingPage 1s linear infinite",
                  }}
                />
                <div style={{ marginTop: "1rem", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 500, fontSize: "0.9rem", color: "white" }}>
                  Regenerating your landing page...
                </div>
                <div style={{ marginTop: "0.5rem", color: "#6366f1", fontSize: "0.8rem", fontStyle: "italic" }}>
                  {editPrompt ? `"${editPrompt}"` : ""}
                </div>
              </div>
            ) : null}

            <iframe
              title="Landing Page Preview"
              srcDoc={getSafePreviewHtml(activeVersion?.html || "")}
              key={activeVersionIndex}
              sandbox="allow-same-origin"
              style={{ width: "100%", height: "100%", border: "none", background: "white" }}
            />
          </div>
        </div>
      )}
    </>
  );
}

function topPillActionStyle(background = "rgba(255,255,255,0.04)", border = "rgba(255,255,255,0.08)", color = "#a1a1aa") {
  return {
    background,
    border: `1px solid ${border}`,
    color,
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: "0.75rem",
    cursor: "pointer",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    whiteSpace: "nowrap",
  };
}

export default GenerateLandingPageButton;
