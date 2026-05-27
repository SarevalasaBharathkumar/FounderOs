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

function parsePricing(pricingStrategy) {
  if (!pricingStrategy) return { model: "Pricing Model", tiers: [], rationale: "" };
  if (typeof pricingStrategy === "object") {
    return {
      model: pricingStrategy.model || "Pricing Model",
      tiers: Array.isArray(pricingStrategy.tiers) ? pricingStrategy.tiers : [],
      rationale: pricingStrategy.rationale || "",
    };
  }
  return { model: "Pricing Model", tiers: [], rationale: pricingStrategy };
}

function normalizeChannel(item, index) {
  if (typeof item === "string") {
    return { name: item, tactic: "Execution tactic not specified", roi: "TBD", key: `${item}-${index}` };
  }
  return {
    name: item?.name || `Channel ${index + 1}`,
    tactic: item?.tactic || item?.channel || "Execution tactic not specified",
    roi: item?.roi || "TBD",
    key: `${item?.name || item?.channel || "channel"}-${index}`,
  };
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
          style={{
            flex: 1,
            background: T.surfaceAlt,
            border: `1px solid ${T.border}`,
            color: T.text,
            borderRadius: 10,
            padding: "10px 12px",
            outline: "none",
          }}
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

export default function GTMPanel({ data, loading, objective = "", onDataPatch, onActionTrigger }) {
  const [panelData, setPanelData] = useState(data);
  useEffect(() => setPanelData(data), [data]);

  const regenerate = async (sectionName) => {
    try {
      const response = await callAgentWithPrompt(
        "gtm",
        `Objective: ${objective}\nCurrent output: ${JSON.stringify(panelData)}\nRegenerate only this section with a stronger, more specific angle: ${sectionName}`
      );
      const nextData = { ...(panelData || {}) };
      if (sectionName === "Positioning" && response.positioningStatement) nextData.positioningStatement = response.positioningStatement;
      if (sectionName === "Target Segments" && response.targetSegments) nextData.targetSegments = response.targetSegments;
      if (sectionName === "Channels" && response.channels) nextData.channels = response.channels;
      if (sectionName === "First Customer Playbook" && response.firstCustomerPlaybook) nextData.firstCustomerPlaybook = response.firstCustomerPlaybook;
      if (sectionName === "Pricing Strategy" && response.pricingStrategy) nextData.pricingStrategy = response.pricingStrategy;
      setPanelData(nextData);
      onDataPatch?.("gtm", nextData);
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

  const segments = Array.isArray(panelData.targetSegments) ? panelData.targetSegments : [];
  const channels = (Array.isArray(panelData.channels) ? panelData.channels : []).map(normalizeChannel);
  const playbook = Array.isArray(panelData.firstCustomerPlaybook) ? panelData.firstCustomerPlaybook : [];
  const pricing = parsePricing(panelData.pricingStrategy);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ border: `1px solid ${T.accent}`, borderRadius: 12, background: T.accentGlow, padding: 16, color: T.text, fontStyle: "italic", lineHeight: 1.5 }}>
        {panelData.positioningStatement}
        <SectionActions sectionName="Positioning" sectionText={panelData.positioningStatement} onRegenerate={() => regenerate("Positioning")} onAction={onActionTrigger} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 14 }}>
          <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 10 }}>Target Segments</div>
          <div style={{ display: "grid", gap: 10 }}>
            {segments.map((segment, index) => (
              <div key={`${segment.segment || "segment"}-${index}`} style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.surfaceAlt, padding: 12 }}>
                <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 8 }}>{segment.segment}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  <span style={{ borderRadius: 999, border: `1px solid ${T.border}`, color: T.dim, fontFamily: FONTS.mono, fontSize: 12, padding: "3px 8px" }}>Size: {segment.size}</span>
                  <span style={{ borderRadius: 999, border: `1px solid ${T.accentSoft}`, color: T.accent, fontFamily: FONTS.mono, fontSize: 12, padding: "3px 8px" }}>Channel: {segment.channel}</span>
                </div>
                <div style={{ color: T.text, fontSize: 14, lineHeight: 1.45 }}>{segment.pain}</div>
              </div>
            ))}
          </div>
          <SectionActions sectionName="Target Segments" sectionText={JSON.stringify(segments)} onRegenerate={() => regenerate("Target Segments")} onAction={onActionTrigger} />
        </div>

        <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 14 }}>
          <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 10 }}>Channels</div>
          <div style={{ display: "grid", gap: 10 }}>
            {channels.map((channel) => (
              <div key={channel.key} style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.surfaceAlt, padding: 12 }}>
                <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 6 }}>{channel.name}</div>
                <div style={{ color: T.dim, fontSize: 13, marginBottom: 6 }}>Tactic: {channel.tactic}</div>
                <div style={{ display: "inline-block", borderRadius: 999, border: `1px solid ${T.green}`, color: T.green, background: `${T.green}1f`, fontFamily: FONTS.mono, fontSize: 12, padding: "3px 8px" }}>
                  ROI: {channel.roi}
                </div>
              </div>
            ))}
          </div>
          <SectionActions sectionName="Channels" sectionText={JSON.stringify(channels)} onRegenerate={() => regenerate("Channels")} onAction={onActionTrigger} />
        </div>
      </div>

      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 14 }}>
        <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 10 }}>First Customer Playbook</div>
        <div style={{ display: "grid", gap: 8 }}>
          {playbook.map((step, index) => (
            <div key={`${step}-${index}`} style={{ display: "flex", gap: 10, alignItems: "start" }}>
              <span style={{ minWidth: 24, height: 24, borderRadius: 999, border: `1px solid ${T.accent}`, color: T.accent, fontFamily: FONTS.mono, fontSize: 12, display: "grid", placeItems: "center" }}>{index + 1}</span>
              <span style={{ color: T.text, lineHeight: 1.45 }}>{step}</span>
            </div>
          ))}
        </div>
        <SectionActions sectionName="First Customer Playbook" sectionText={playbook.join("\n")} onRegenerate={() => regenerate("First Customer Playbook")} onAction={onActionTrigger} />
      </div>

      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 14 }}>
        <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 10 }}>Pricing Strategy: {pricing.model}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {pricing.tiers.map((tier, index) => (
            <span key={`${tier}-${index}`} style={{ borderRadius: 999, border: `1px solid ${T.amber}`, color: T.amber, background: `${T.amber}1f`, fontFamily: FONTS.mono, fontSize: 12, padding: "3px 8px" }}>
              {tier}
            </span>
          ))}
        </div>
        <div style={{ color: T.text, lineHeight: 1.5 }}>{pricing.rationale}</div>
        <SectionActions sectionName="Pricing Strategy" sectionText={JSON.stringify(pricing)} onRegenerate={() => regenerate("Pricing Strategy")} onAction={onActionTrigger} />
      </div>

      <PanelChat data={panelData} objective={objective} onAction={onActionTrigger} />
      <ActionBar agentId="gtm" data={data} objective={objective} />
    </div>
  );
}
