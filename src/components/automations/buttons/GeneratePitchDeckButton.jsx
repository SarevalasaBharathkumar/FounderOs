"use client";

import { useEffect, useRef, useState } from "react";
import ActionButton from "../ActionButton";

const TYPE_COLORS = {
  cover: "#6366F1",
  problem: "#EF4444",
  solution: "#22C55E",
  market: "#F59E0B",
  traction: "#22C55E",
  product: "#6366F1",
  business: "#8B5CF6",
  team: "#6366F1",
  roadmap: "#8B5CF6",
  ask: "#6366F1",
};

function ClickGame({ onScore }) {
  const [targets, setTargets] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const id = Date.now();
      setTargets((prev) => [
        ...prev.slice(-6),
        {
          id,
          x: 10 + Math.random() * 80,
          y: 10 + Math.random() * 80,
          size: 24 + Math.random() * 20,
          color: ["6366F1", "22C55E", "F59E0B", "8B5CF6", "EF4444"][Math.floor(Math.random() * 5)],
        },
      ]);
      setTimeout(() => {
        setTargets((prev) => prev.filter((t) => t.id !== id));
      }, 1500);
    }, 800);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const hit = (id) => {
    setTargets((prev) => prev.filter((t) => t.id !== id));
    const nextScore = score + 1;
    setScore(nextScore);
    onScore(nextScore);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "220px",
        background: "rgba(99,102,241,0.04)",
        border: "1px solid rgba(99,102,241,0.12)",
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "crosshair",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: "0.75rem", color: "#6366f1", fontFamily: "Inter", fontWeight: 600 }}>Score: {score}</span>
        <span style={{ fontSize: "0.75rem", color: timeLeft < 5 ? "#ef4444" : "#52525b", fontFamily: "Inter" }}>{timeLeft > 0 ? `${timeLeft}s` : "Time up!"}</span>
      </div>

      {targets.map((t) => (
        <div
          key={t.id}
          onClick={() => hit(t.id)}
          style={{
            position: "absolute",
            left: `${t.x}%`,
            top: `${t.y}%`,
            width: t.size,
            height: t.size,
            borderRadius: "50%",
            background: `#${t.color}`,
            boxShadow: `0 0 ${t.size}px #${t.color}88`,
            cursor: "pointer",
            transform: "translate(-50%, -50%)",
            animation: "popIn 0.15s ease-out",
          }}
        />
      ))}

      {targets.length === 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#52525b",
            fontSize: "0.8rem",
            fontFamily: "Inter",
          }}
        >
          Click the dots!
        </div>
      )}

      <style>{`
        @keyframes popIn {
          from { transform: translate(-50%,-50%) scale(0); }
          to { transform: translate(-50%,-50%) scale(1); }
        }
      `}</style>
    </div>
  );
}

async function loadPptxGen() {
  return new Promise((resolve, reject) => {
    if (window.PptxGenJS) {
      resolve(window.PptxGenJS);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
    script.onload = () => resolve(window.PptxGenJS);
    script.onerror = () => reject(new Error("Failed to load PPTX library"));
    document.head.appendChild(script);
  });
}

async function exportPptxClientSide(slides, objective) {
  const PptxGenJS = await loadPptxGen();
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.title = "Investor Pitch Deck";
  pres.author = "FounderOS";

  const BG = "000000";
  const WHITE = "FFFFFF";
  const SUBTEXT = "A1A1AA";
  const MUTED = "52525B";

  slides.forEach((slide, index) => {
    const s = pres.addSlide();
    const accentColor = (TYPE_COLORS[slide?.type] || "#6366F1").replace("#", "");
    s.background = { color: BG };

    s.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: "100%",
      h: 0.06,
      fill: { color: accentColor },
      line: { color: accentColor },
    });

    s.addText(`${index + 1}/10`, {
      x: 8.8,
      y: 5.2,
      w: 1,
      h: 0.3,
      fontSize: 9,
      color: MUTED,
      fontFace: "Calibri",
      margin: 0,
    });

    s.addText("FounderOS", {
      x: 0.3,
      y: 5.2,
      w: 2,
      h: 0.3,
      fontSize: 9,
      color: MUTED,
      fontFace: "Calibri",
      margin: 0,
    });

    if (slide?.type === "cover") {
      s.addShape(pres.ShapeType.ellipse, {
        x: 2,
        y: 0.5,
        w: 6,
        h: 4.5,
        fill: { color: accentColor, transparency: 92 },
        line: { color: accentColor, transparency: 92 },
      });
      s.addText(slide?.title || "Startup", {
        x: 0.5,
        y: 1.2,
        w: 9,
        h: 1.6,
        fontSize: 54,
        bold: true,
        color: WHITE,
        fontFace: "Calibri",
        align: "center",
        margin: 0,
      });
      s.addText(slide?.subtitle || "", {
        x: 0.5,
        y: 2.9,
        w: 9,
        h: 0.6,
        fontSize: 18,
        color: SUBTEXT,
        fontFace: "Calibri",
        align: "center",
        margin: 0,
      });
      s.addText(objective ? objective.slice(0, 100) : "", {
        x: 1,
        y: 3.7,
        w: 8,
        h: 0.4,
        fontSize: 11,
        color: MUTED,
        fontFace: "Calibri",
        align: "center",
        margin: 0,
        italic: true,
      });
    } else {
      s.addText(String(slide?.type || "").toUpperCase(), {
        x: 0.4,
        y: 0.14,
        w: 5,
        h: 0.2,
        fontSize: 9,
        color: accentColor,
        fontFace: "Calibri",
        charSpacing: 3,
        margin: 0,
      });
      s.addText(slide?.title || "", {
        x: 0.4,
        y: 0.42,
        w: slide?.stat ? 5.8 : 9.2,
        h: 0.85,
        fontSize: 30,
        bold: true,
        color: WHITE,
        fontFace: "Calibri",
        margin: 0,
      });
      if (slide?.subtitle) {
        s.addText(slide.subtitle, {
          x: 0.4,
          y: 1.32,
          w: slide?.stat ? 5.8 : 9.2,
          h: 0.45,
          fontSize: 13,
          color: SUBTEXT,
          fontFace: "Calibri",
          margin: 0,
        });
      }

      const bullets = Array.isArray(slide?.bullets) ? slide.bullets : [];
      const bulletsData = bullets.map((b, i) => ({
        text: "  " + b,
        options: {
          breakLine: i < bullets.length - 1,
          color: SUBTEXT,
          bullet: { color: accentColor },
        },
      }));
      if (bulletsData.length > 0) {
        s.addText(bulletsData, {
          x: 0.4,
          y: slide?.subtitle ? 1.9 : 1.45,
          w: slide?.stat ? 5.8 : 9.2,
          h: 3.0,
          fontSize: 14,
          fontFace: "Calibri",
          margin: 0,
          paraSpaceAfter: 10,
        });
      }
    }
  });

  await pres.writeFile({ fileName: "investor-pitch-deck.pptx" });
}

export default function GeneratePitchDeckButton({ data, objective }) {
  const [phase, setPhase] = useState("idle");
  const [slides, setSlides] = useState(null);
  const [editableSlides, setEditableSlides] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [editing, setEditing] = useState(false);

  async function fetchSlideContent() {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_KEY}`,
        "HTTP-Referer": "https://founderos.app",
        "X-Title": "FounderOS",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content: `You are a pitch deck strategist who has helped 200+ startups raise 
funding from YC, Sequoia, and a16z. Generate pitch deck slide content.
Return ONLY a valid JSON array of exactly 10 objects. No markdown. No explanation.`,
          },
          {
            role: "user",
            content: `Create a 10-slide investor pitch deck:

Objective: ${objective}
Hook: ${data.investorPitch?.hook || ""}
Problem: ${data.investorPitch?.problem || ""}
Solution: ${data.investorPitch?.solution || ""}
Market: ${data.investorPitch?.marketOpportunity || data.investorPitch?.market || ""}
Traction: ${data.investorPitch?.traction || ""}
Business Model: ${data.investorPitch?.businessModel || ""}
Why Us: ${data.investorPitch?.whyUs || ""}
Ask: ${data.investorPitch?.ask || ""}

Return JSON array of 10 slides:
[{
  "slideNumber": 1,
  "title": "string",
  "subtitle": "one compelling sentence under 15 words",
  "bullets": ["point 1 under 12 words", "point 2", "point 3"],
  "stat": "big number/metric (optional, e.g. $4.2B or 340%)",
  "statLabel": "label for stat (optional)",
  "type": "cover|problem|solution|market|traction|product|business|team|roadmap|ask"
}]

Slide order: cover, problem, solution, market, product, traction, business, team, roadmap, ask
All content specific to this startup. No generic placeholders.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${text}`);
    }

    const result = await response.json();
    const raw = result.choices?.[0]?.message?.content || "[]";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) {
        throw new Error("Model did not return valid slide JSON");
      }
      parsed = JSON.parse(match[0]);
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("No slides generated");
    }
    return parsed.slice(0, 10).map((slide, index) => ({
      slideNumber: index + 1,
      title: slide?.title || `Slide ${index + 1}`,
      subtitle: slide?.subtitle || "",
      bullets: Array.isArray(slide?.bullets) ? slide.bullets : [],
      stat: slide?.stat || "",
      statLabel: slide?.statLabel || "",
      type: slide?.type || "cover",
    }));
  }

  async function downloadPPTX(slidesToUse) {
    setPhase("downloading");
    const payloadSlides = slidesToUse || editableSlides;
    try {
      const response = await fetch("/api/generate-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: payloadSlides, objective }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/vnd.openxmlformats-officedocument.presentationml.presentation")) {
        throw new Error("API export unavailable");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "investor-pitch-deck.pptx";
      a.click();
      URL.revokeObjectURL(url);
      setPhase("ready");
      return;
    } catch {
      await exportPptxClientSide(payloadSlides, objective);
      setPhase("ready");
    }
  }

  async function handleGenerate() {
    if (phase === "ready" && editableSlides?.length) {
      setShowModal(true);
      return;
    }

    setShowModal(true);
    setPhase("fetching");
    setError(null);
    setGameScore(0);

    try {
      const slideData = await fetchSlideContent();
      setSlides(slideData);
      setEditableSlides(JSON.parse(JSON.stringify(slideData)));
      setPhase("ready");
      setActiveSlide(0);
    } catch (e) {
      setError(e.message);
      setPhase("idle");
    }
  }

  const currentSlide = editableSlides?.[activeSlide] || null;
  const typeColor = TYPE_COLORS[currentSlide?.type] || "#6366F1";

  const saveEdit = () => {
    setEditing(false);
    setPhase("ready");
  };

  const cancelEdit = () => {
    setEditableSlides((prev) => {
      if (!prev || !slides?.[activeSlide]) return prev;
      const updated = [...prev];
      updated[activeSlide] = JSON.parse(JSON.stringify(slides[activeSlide]));
      return updated;
    });
    setEditing(false);
    setPhase("ready");
  };

  const updateSlideField = (field, newValue) => {
    setEditableSlides((prev) => {
      if (!prev) return prev;
      const updated = [...prev];
      updated[activeSlide] = { ...updated[activeSlide], [field]: newValue };
      return updated;
    });
  };

  const updateBullet = (bulletIndex, newValue) => {
    setEditableSlides((prev) => {
      if (!prev) return prev;
      const updated = [...prev];
      const bullets = [...(updated[activeSlide]?.bullets || [])];
      bullets[bulletIndex] = newValue;
      updated[activeSlide] = { ...updated[activeSlide], bullets };
      return updated;
    });
  };

  const removeBullet = (bulletIndex) => {
    setEditableSlides((prev) => {
      if (!prev) return prev;
      const updated = [...prev];
      const bullets = [...(updated[activeSlide]?.bullets || [])];
      bullets.splice(bulletIndex, 1);
      updated[activeSlide] = { ...updated[activeSlide], bullets };
      return updated;
    });
  };

  const addBullet = () => {
    setEditableSlides((prev) => {
      if (!prev) return prev;
      const updated = [...prev];
      const bullets = [...(updated[activeSlide]?.bullets || [])];
      bullets.push("");
      updated[activeSlide] = { ...updated[activeSlide], bullets };
      return updated;
    });
  };

  const copyAllContent = async () => {
    const text = (editableSlides || [])
      .map((s, i) => [`Slide ${i + 1}: ${s.title}`, s.subtitle || "", ...(s.bullets || []).map((b) => `- ${b}`)].join("\n"))
      .join("\n\n");
    await navigator.clipboard.writeText(text);
  };

  return (
    <>
      <ActionButton
        icon="🎯"
        label={phase === "ready" ? "Open Pitch Deck" : "Generate Pitch Deck"}
        loading={phase === "fetching" || phase === "downloading"}
        onClick={handleGenerate}
        variant="primary"
      />

      {showModal && (
        <div
          onClick={() => {
            if (phase === "ready") setShowModal(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "3vh",
            overflowY: "auto",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, calc(100vw - 2rem))",
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: "1.5rem",
              marginBottom: "2rem",
              color: "white",
              fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {phase === "fetching" ? (
              <div>
                <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: 14 }}>Crafting your investor pitch deck...</div>
                <div style={{ textAlign: "center", fontSize: "0.72rem", color: "#52525b", margin: "10px 0" }}>Play while you wait</div>
                <ClickGame onScore={setGameScore} />
                <div style={{ textAlign: "center", marginTop: 10, fontSize: "0.8rem", color: "#6366f1", fontWeight: 500 }}>
                  Your score: {gameScore} clicks 🎯
                </div>
              </div>
            ) : null}

            {(phase === "ready" || phase === "editing" || phase === "downloading") && currentSlide ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>🎯 Your Pitch is Ready!</div>
                    <div style={{ fontSize: "0.72rem", color: "#52525b", marginTop: 2 }}>10 slides · Investor-ready · Fully editable</div>
                  </div>
                  <button type="button" onClick={() => setShowModal(false)} style={ghostBtn}>✕ Close</button>
                </div>

                <div style={{ overflowX: "auto", display: "flex", gap: 6, paddingBottom: 4, marginBottom: 12 }}>
                  {(editableSlides || []).map((item, idx) => {
                    const pillColor = TYPE_COLORS[item?.type] || "#6366f1";
                    return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveSlide(idx);
                        setEditing(false);
                        if (phase !== "downloading") setPhase("ready");
                      }}
                      style={{
                        minWidth: 36,
                        height: 36,
                        borderRadius: 999,
                        border: `1px solid ${idx === activeSlide ? pillColor : "rgba(255,255,255,0.08)"}`,
                        background: idx === activeSlide ? pillColor : "transparent",
                        color: idx === activeSlide ? "#fff" : "#52525b",
                        cursor: "pointer",
                        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                        fontWeight: 600,
                        fontSize: "0.78rem",
                      }}
                      onMouseEnter={(e) => {
                        if (idx !== activeSlide) {
                          e.currentTarget.style.border = "1px solid rgba(255,255,255,0.2)";
                          e.currentTarget.style.color = "#a1a1aa";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (idx !== activeSlide) {
                          e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
                          e.currentTarget.style.color = "#52525b";
                        }
                      }}
                    >
                      {idx + 1}
                    </button>
                    );
                  })}
                </div>

                {!editing ? (
                  <div
                    style={{
                      background: "#0a0a0a",
                      border: `2px solid ${typeColor}33`,
                      borderRadius: 16,
                      padding: 0,
                      overflow: "hidden",
                      minHeight: 320,
                      position: "relative",
                    }}
                  >
                    <div style={{ height: 4, width: "100%", background: typeColor }} />
                    <div style={{ padding: "1.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span
                          style={{
                            background: `${typeColor}22`,
                            border: `1px solid ${typeColor}44`,
                            borderRadius: 999,
                            padding: "3px 10px",
                            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                            fontWeight: 600,
                            fontSize: "0.65rem",
                            color: typeColor,
                          }}
                        >
                          {String(currentSlide.type || "").toUpperCase()}
                        </span>
                        <span style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 400, fontSize: "0.72rem", color: "#52525b" }}>
                          {`Slide ${activeSlide + 1} of 10`}
                        </span>
                      </div>
                      <div style={{ marginTop: "1rem", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                        {currentSlide.title}
                      </div>
                      <div style={{ marginTop: "0.4rem", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 400, fontSize: "0.9rem", color: "#a1a1aa", lineHeight: 1.5 }}>
                        {currentSlide.subtitle}
                      </div>

                      {currentSlide.stat ? (
                        <div
                          style={{
                            marginTop: "1rem",
                            display: "inline-flex",
                            alignItems: "baseline",
                            gap: 8,
                            background: `${typeColor}15`,
                            border: `1px solid ${typeColor}33`,
                            borderRadius: 10,
                            padding: "8px 16px",
                          }}
                        >
                          <span style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 800, fontSize: "2rem", color: typeColor }}>
                            {currentSlide.stat}
                          </span>
                          <span style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 400, fontSize: "0.78rem", color: "#71717a" }}>
                            {currentSlide.statLabel}
                          </span>
                        </div>
                      ) : null}

                      <div style={{ marginTop: "1rem" }}>
                        {(currentSlide.bullets || []).map((b, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: typeColor, flexShrink: 0, marginTop: 7 }} />
                            <span style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 400, fontSize: "0.88rem", color: "#a1a1aa", lineHeight: 1.5 }}>
                              {b}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        bottom: 12,
                        right: 16,
                        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                        fontWeight: 900,
                        fontSize: "3rem",
                        color: "rgba(255,255,255,0.03)",
                        letterSpacing: "-0.05em",
                        userSelect: "none",
                      }}
                    >
                      {activeSlide + 1}
                    </div>
                  </div>
                ) : (
                  <div style={previewCard}>
                    <div style={fieldLabelStyle}>Title</div>
                    <input style={inputStyle} value={editableSlides?.[activeSlide]?.title || ""} onChange={(e) => updateSlideField("title", e.target.value)} />
                    <div style={fieldLabelStyle}>Subtitle</div>
                    <input style={inputStyle} value={editableSlides?.[activeSlide]?.subtitle || ""} onChange={(e) => updateSlideField("subtitle", e.target.value)} />
                    <div style={fieldLabelStyle}>Stat</div>
                    <input style={inputStyle} value={editableSlides?.[activeSlide]?.stat || ""} onChange={(e) => updateSlideField("stat", e.target.value)} placeholder="e.g. $4.2B or 340% MoM" />
                    <div style={fieldLabelStyle}>Stat Label</div>
                    <input style={inputStyle} value={editableSlides?.[activeSlide]?.statLabel || ""} onChange={(e) => updateSlideField("statLabel", e.target.value)} placeholder="label for the stat" />
                    <div style={fieldLabelStyle}>Bullets</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {(editableSlides?.[activeSlide]?.bullets || []).map((bullet, idx) => (
                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                          <input style={inputStyle} value={bullet} onChange={(e) => updateBullet(idx, e.target.value)} />
                          <button type="button" style={ghostBtn} onClick={() => removeBullet(idx)}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <button type="button" style={{ ...ghostBtn, width: "fit-content" }} onClick={addBullet}>
                      + Add bullet
                    </button>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button type="button" style={solidBtn} onClick={saveEdit}>✓ Save</button>
                      <button type="button" style={ghostBtn} onClick={cancelEdit}>✗ Cancel</button>
                    </div>
                  </div>
                )}

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", marginTop: "1rem", display: "flex", gap: 10, alignItems: "center" }}>
                  <button type="button" style={{ ...ghostBtn, opacity: activeSlide === 0 ? 0.5 : 1 }} disabled={activeSlide === 0} onClick={() => setActiveSlide((p) => p - 1)}>← Prev</button>
                  <button type="button" style={{ ...ghostBtn, opacity: activeSlide === 9 ? 0.5 : 1 }} disabled={activeSlide === 9} onClick={() => setActiveSlide((p) => p + 1)}>Next →</button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editing) {
                        saveEdit();
                        return;
                      }
                      setEditing(true);
                      setPhase("editing");
                    }}
                    style={{
                      marginLeft: "auto",
                      borderRadius: 999,
                      padding: "8px 12px",
                      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                      fontWeight: 500,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      border: editing ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(99,102,241,0.2)",
                      background: editing ? "rgba(34,197,94,0.08)" : "rgba(99,102,241,0.08)",
                      color: editing ? "#22c55e" : "#818cf8",
                    }}
                  >
                    {editing ? "✓ Save" : "✏️ Edit Slide"}
                  </button>
                  <button
                    type="button"
                    style={{ ...solidBtn, fontSize: "0.85rem", padding: "10px 20px", opacity: phase === "downloading" ? 0.5 : 1 }}
                    disabled={phase === "downloading"}
                    onClick={async () => {
                      try {
                        await downloadPPTX(editableSlides);
                      } catch (e) {
                        setError(e.message);
                        setPhase("ready");
                      }
                    }}
                  >
                    {phase === "downloading" ? "Exporting..." : "⬇️ Export PPTX"}
                  </button>
                </div>
              </div>
            ) : null}

            {error ? <div style={{ marginTop: 10, color: "#f87171", fontSize: "0.8rem" }}>{error}</div> : null}
          </div>
        </div>
      )}
    </>
  );
}

const previewCard = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  padding: "1.5rem",
  minHeight: 260,
};

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  padding: "10px 12px",
  color: "white",
  fontSize: "0.85rem",
  outline: "none",
};

const fieldLabelStyle = {
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  fontWeight: 500,
  fontSize: "0.72rem",
  color: "#71717a",
  marginBottom: 4,
};

const solidBtn = {
  border: "1px solid #ffffff",
  borderRadius: 999,
  padding: "8px 12px",
  background: "#ffffff",
  color: "#000000",
  cursor: "pointer",
  fontSize: "0.78rem",
  fontWeight: 600,
};

const ghostBtn = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 999,
  padding: "8px 12px",
  background: "transparent",
  color: "#a1a1aa",
  cursor: "pointer",
  fontSize: "0.78rem",
};
