"use client";
import { useEffect, useRef, useState } from "react";
import { callAdvisorFollowup, callAgentWithPrompt, pushActivity } from "../agents/interactive";
import ActionBar from "../components/automations/ActionBar";
import { FONTS, T } from "../styles/tokens";

const skeletonStyle = {
  borderRadius: 12,
  height: 84,
  background: `linear-gradient(90deg, ${T.surface} 0%, ${T.surfaceAlt} 50%, ${T.surface} 100%)`,
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
  border: `1px solid ${T.border}`,
};

const actionBase = {
  border: `1px solid ${T.border}`,
  borderRadius: 20,
  background: T.surfaceAlt,
  color: T.muted,
  fontSize: "0.65rem",
  padding: "4px 8px",
  cursor: "pointer",
};

function getScoreColor(score) {
  if (score < 35) return T.green;
  if (score <= 65) return T.amber;
  return T.red;
}

function getSeverityColor(severity) {
  const value = String(severity || "").toLowerCase();
  if (value === "low") return T.green;
  if (value === "medium") return T.amber;
  return T.red;
}

function getProbabilityColor(probability) {
  const value = String(probability || "").toLowerCase();
  if (value === "low") return T.green;
  if (value === "medium") return T.amber;
  return T.red;
}

function SectionActions({ sectionName, sectionText, onRegenerate, onAction }) {
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);

  const copySection = async () => {
    await navigator.clipboard.writeText(sectionText || "");
    setCopied(true);
    pushActivity("copy", sectionName);
    onAction?.();
    setTimeout(() => setCopied(false), 1500);
  };

  const markDone = () => {
    setDone(true);
    pushActivity("done", sectionName);
    onAction?.();
  };

  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 10, position: "relative" }}>
      {done ? <span style={{ position: "absolute", top: -40, right: 0, color: T.green, fontSize: 18 }}>✓</span> : null}
      <button type="button" onClick={copySection} style={actionBase}>
        {copied ? "Copied!" : "📋 Copy"}
      </button>
      <button type="button" onClick={onRegenerate} style={actionBase}>
        🔄 Regenerate
      </button>
      <button type="button" onClick={markDone} style={actionBase}>
        ✓ Done
      </button>
    </div>
  );
}

function PanelChat({ data, objective, onAction }) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(null);

  const submit = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const nextHistory = [...history, { role: "user", content: text }];
    setHistory(nextHistory);
    setInput("");
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await callAdvisorFollowup({
        objective,
        data,
        conversationHistory: nextHistory,
        userMessage: text,
        signal: controller.signal,
      });
      setHistory((prev) => [...prev, { role: "assistant", content: response }]);
      onAction?.();
    } catch (error) {
      if (error.name !== "AbortError") {
        setHistory((prev) => [...prev, { role: "assistant", content: `I hit an error: ${error.message}` }]);
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  };

  const stop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setBusy(false);
    }
  };

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && submit()}
          placeholder="Push back or ask a follow-up..."
          style={{ flex: 1, background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.text, borderRadius: 10, padding: "10px 12px", outline: "none" }}
        />
        <button
          type="button"
          onClick={busy ? stop : submit}
          disabled={!busy && !input.trim()}
          style={{ ...actionBase, fontSize: "0.75rem", minWidth: 46 }}
        >
          {busy ? "■" : "Send"}
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 400, overflowY: "auto", padding: "1rem 0" }}>
        {history.map((item, index) => (
          <div
            key={`${item.role}-${index}`}
            style={
              item.role === "user"
                ? {
                    background: "rgba(99,102,241,0.15)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: "12px 12px 2px 12px",
                    padding: "10px 14px",
                    fontFamily: FONTS.sans,
                    fontWeight: 400,
                    fontSize: "0.85rem",
                    color: "#ffffff",
                    maxWidth: "80%",
                    alignSelf: "flex-end",
                  }
                : {
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "12px 12px 12px 2px",
                    padding: "10px 14px",
                    fontFamily: FONTS.sans,
                    fontWeight: 400,
                    fontSize: "0.85rem",
                    color: "#a1a1aa",
                    maxWidth: "85%",
                    alignSelf: "flex-start",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                  }
            }
          >
            {item.content}
          </div>
        ))}
        {busy ? (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px 12px 12px 2px", padding: "10px 14px", maxWidth: "85%", alignSelf: "flex-start", display: "inline-flex", gap: 6, alignItems: "center" }}>
            {[0, 1, 2].map((dot) => (
              <span key={dot} style={{ width: 6, height: 6, borderRadius: "50%", background: "#a1a1aa", animation: `typingPulse 1s ${dot * 0.2}s infinite ease-in-out`, display: "inline-block" }} />
            ))}
            <style>{`@keyframes typingPulse {0%,100%{transform:scale(0.8);opacity:0.55;}50%{transform:scale(1.15);opacity:1;}}`}</style>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function RiskPanel({ data, loading, objective = "", onDataPatch, onActionTrigger }) {
  const [panelData, setPanelData] = useState(data);
  useEffect(() => setPanelData(data), [data]);

  const regenerate = async (sectionName) => {
    try {
      const response = await callAgentWithPrompt(
        "risk",
        `Objective: ${objective}\nCurrent output: ${JSON.stringify(panelData)}\nRegenerate only this section with a stronger, more specific angle: ${sectionName}`
      );
      const nextData = { ...(panelData || {}) };
      if (sectionName === "Risk Score" && (response.riskScore !== undefined || response.verdict || response.runwayAdvice)) {
        nextData.riskScore = response.riskScore ?? nextData.riskScore;
        nextData.verdict = response.verdict ?? nextData.verdict;
        nextData.runwayAdvice = response.runwayAdvice ?? nextData.runwayAdvice;
      }
      if (sectionName === "Blind Spots" && response.blindSpots) nextData.blindSpots = response.blindSpots;
      if (sectionName === "Critical Assumptions" && response.criticalAssumptions) nextData.criticalAssumptions = response.criticalAssumptions;
      if (sectionName === "Risk Register" && response.risks) nextData.risks = response.risks;
      setPanelData(nextData);
      onDataPatch?.("risk", nextData);
      pushActivity("regenerate", sectionName);
      onActionTrigger?.();
    } catch {
      return;
    }
  };

  if (loading) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        <div style={skeletonStyle} />
        <div style={skeletonStyle} />
        <div style={skeletonStyle} />
        <div style={skeletonStyle} />
      </div>
    );
  }

  if (!panelData) {
    return (
      <div style={{ minHeight: 260, display: "grid", placeItems: "center", textAlign: "center", border: `1px dashed ${T.border}`, borderRadius: 14, background: T.surface, color: T.dim, padding: 24 }}>
        <div>
          <div style={{ fontSize: 34, opacity: 0.35, marginBottom: 10 }}>⚡</div>
          <div style={{ fontFamily: FONTS.sans, fontSize: 16 }}>Run an objective to see your roadmap</div>
        </div>
      </div>
    );
  }

  const riskScore = Number.isFinite(panelData.riskScore) ? panelData.riskScore : 0;
  const scoreColor = getScoreColor(riskScore);
  const blindSpots = Array.isArray(panelData.blindSpots) ? panelData.blindSpots : [];
  const assumptions = Array.isArray(panelData.criticalAssumptions) ? panelData.criticalAssumptions : [];
  const risks = Array.isArray(panelData.risks) ? panelData.risks : [];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 14, display: "grid", alignContent: "start", gap: 10 }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", border: `4px solid ${scoreColor}`, display: "grid", placeItems: "center", color: scoreColor, fontFamily: FONTS.sans, fontWeight: 700, fontSize: 28 }}>{riskScore}</div>
          <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700 }}>{panelData.verdict}</div>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.surfaceAlt, padding: 10, color: T.dim, lineHeight: 1.45 }}>{panelData.runwayAdvice}</div>
          <SectionActions sectionName="Risk Score" sectionText={`${riskScore} ${panelData.verdict} ${panelData.runwayAdvice}`} onRegenerate={() => regenerate("Risk Score")} onAction={onActionTrigger} />
        </div>

        <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 14, display: "grid", alignContent: "start", gap: 12 }}>
          <div>
            <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 8 }}>Blind Spots</div>
            <div style={{ display: "grid", gap: 7 }}>
              {blindSpots.map((item, index) => (
                <div key={`${item}-${index}`} style={{ display: "flex", gap: 8, alignItems: "start", color: T.text }}>
                  <span style={{ color: T.amber, lineHeight: 1 }}>●</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <SectionActions sectionName="Blind Spots" sectionText={blindSpots.join("\n")} onRegenerate={() => regenerate("Blind Spots")} onAction={onActionTrigger} />
          </div>

          <div>
            <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 8 }}>Critical Assumptions</div>
            <div style={{ display: "grid", gap: 7 }}>
              {assumptions.map((item, index) => (
                <div key={`${item}-${index}`} style={{ display: "flex", gap: 8, alignItems: "start", color: T.text }}>
                  <span style={{ color: T.red, lineHeight: 1 }}>●</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <SectionActions sectionName="Critical Assumptions" sectionText={assumptions.join("\n")} onRegenerate={() => regenerate("Critical Assumptions")} onAction={onActionTrigger} />
          </div>
        </div>
      </div>

      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 14 }}>
        <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 10 }}>Risk Register</div>
        <div style={{ display: "grid", gap: 10 }}>
          {risks.map((entry, index) => {
            const severityColor = getSeverityColor(entry.severity);
            const probabilityColor = getProbabilityColor(entry.probability);
            return (
              <div key={`${entry.category || "risk"}-${entry.risk || index}`} style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.surfaceAlt, padding: 12, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ borderRadius: 999, border: `1px solid ${T.accent}`, color: T.accent, fontFamily: FONTS.mono, fontSize: 12, padding: "3px 8px" }}>{entry.category}</span>
                  <span style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700 }}>{entry.risk}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ borderRadius: 999, border: `1px solid ${severityColor}`, color: severityColor, background: `${severityColor}1f`, fontFamily: FONTS.mono, fontSize: 12, padding: "3px 8px" }}>
                    Severity: {entry.severity}
                  </span>
                  <span style={{ borderRadius: 999, border: `1px solid ${probabilityColor}`, color: probabilityColor, background: `${probabilityColor}1f`, fontFamily: FONTS.mono, fontSize: 12, padding: "3px 8px" }}>
                    Probability: {entry.probability}
                  </span>
                </div>
                <div style={{ color: T.dim, lineHeight: 1.45 }}>{entry.mitigation}</div>
              </div>
            );
          })}
        </div>
        <SectionActions sectionName="Risk Register" sectionText={JSON.stringify(risks)} onRegenerate={() => regenerate("Risk Register")} onAction={onActionTrigger} />
      </div>

      <PanelChat data={panelData} objective={objective} onAction={onActionTrigger} />
      <ActionBar agentId="risk" data={data} objective={objective} />
    </div>
  );
}
