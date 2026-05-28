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

const copyIconBtn = {
  border: `1px solid ${T.border}`,
  background: T.surface,
  borderRadius: 8,
  color: T.textSub,
  fontSize: "0.75rem",
  width: 28,
  height: 28,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};

function SectionActions({ sectionName, onRegenerate, onAction }) {
  const [done, setDone] = useState(false);

  const markDone = () => {
    setDone(true);
    pushActivity("done", sectionName);
    onAction?.();
  };

  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 10, position: "relative" }}>
      {done ? <span style={{ position: "absolute", top: -40, right: 0, color: T.green, fontSize: 18 }}>✓</span> : null}
      <button type="button" onClick={onRegenerate} style={actionBase}>
        Regenerate
      </button>
      <button type="button" onClick={markDone} style={actionBase}>
        Done
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
          {busy ? "Stop" : "Send"}
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
      </div>
    </div>
  );
}

export default function OutreachPanel({ data, loading, objective = "", onDataPatch, onActionTrigger }) {
  const [panelData, setPanelData] = useState(data);
  useEffect(() => setPanelData(data), [data]);

  const regenerate = async (sectionName) => {
    try {
      const response = await callAgentWithPrompt(
        "outreach",
        `Objective: ${objective}\nCurrent output: ${JSON.stringify(panelData)}\nRegenerate only this section with a stronger, more specific angle: ${sectionName}`
      );
      const nextData = { ...(panelData || {}) };
      if (sectionName === "Cold Email Sequence" && response.coldEmailSequence) nextData.coldEmailSequence = response.coldEmailSequence;
      if (sectionName === "LinkedIn DM" && response.linkedInMessage) nextData.linkedInMessage = response.linkedInMessage;
      if (sectionName === "Investor Pitch" && response.investorPitch) nextData.investorPitch = response.investorPitch;
      if (sectionName === "Twitter Thread" && response.twitterThread) nextData.twitterThread = response.twitterThread;
      setPanelData(nextData);
      onDataPatch?.("outreach", nextData);
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
          <div style={{ fontFamily: FONTS.sans, fontSize: 16 }}>Run an objective to see your outreach outputs</div>
        </div>
      </div>
    );
  }

  const emails = Array.isArray(panelData.coldEmailSequence) ? panelData.coldEmailSequence : [];
  const linkedInMessage = panelData.linkedInMessage || "";
  const investorPitch = panelData.investorPitch || {};
  const pitchFields = [
    { key: "hook", label: "Hook", color: T.accent },
    { key: "problem", label: "Problem", color: T.red },
    { key: "solution", label: "Solution", color: T.green },
    { key: "marketOpportunity", label: "Market Opportunity", color: T.amber },
    { key: "traction", label: "Traction", color: T.green },
    { key: "businessModel", label: "Business Model", color: T.purple },
    { key: "whyUs", label: "Why Us", color: T.accent },
    { key: "ask", label: "The Ask", color: T.red },
  ];
  const thread = Array.isArray(panelData.twitterThread) ? panelData.twitterThread : [];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 14 }}>
            {emails.map((email, index) => (
              <div key={`${email.subject || "email"}-${index}`} style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surfaceAlt, padding: 14, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontFamily: FONTS.mono, color: T.amber, fontSize: 12 }}>Day {email.day || index + 1}</div>
                  <button
                    type="button"
                    title="Copy this email"
                    aria-label={`Copy email day ${email.day || index + 1}`}
                    onClick={() => navigator.clipboard.writeText(`Day ${email.day || index + 1}\nSubject: ${email.subject || ""}\n\n${email.body || ""}`)}
                    style={copyIconBtn}
                  >
                    ⧉
                  </button>
                </div>
                <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 8, whiteSpace: "pre-wrap" }}>{email.subject}</div>
                <div style={{ color: T.dim, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{email.body}</div>
              </div>
            ))}
            <SectionActions sectionName="Cold Email Sequence" onRegenerate={() => regenerate("Cold Email Sequence")} onAction={onActionTrigger} />
          </div>

          <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surfaceAlt, padding: 14 }}>
            <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 8 }}>LinkedIn DM</div>
            <div style={{ color: T.dim, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{linkedInMessage}</div>
            <SectionActions sectionName="LinkedIn DM" onRegenerate={() => regenerate("LinkedIn DM")} onAction={onActionTrigger} />
          </div>
        </div>

        <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 14, display: "grid", gap: 10, alignContent: "start" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700 }}>Investor Pitch</div>
            <button
              type="button"
              title="Copy investor pitch"
              aria-label="Copy investor pitch"
              onClick={() => {
                const text = pitchFields.map((field) => `${field.label}: ${investorPitch[field.key] || ""}`).join("\n\n");
                navigator.clipboard.writeText(text);
              }}
              style={copyIconBtn}
            >
              ⧉
            </button>
          </div>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.surfaceAlt, padding: "0 12px" }}>
            {pitchFields.map((field, index) => (
              <div
                key={field.key}
                style={{
                  padding: "0.75rem 0",
                  borderBottom: index < pitchFields.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
                <div style={{ fontFamily: FONTS.mono, fontSize: "0.62rem", textTransform: "uppercase", color: field.color, letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
                  {field.label}
                </div>
                <div style={{ fontSize: "0.85rem", color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{investorPitch[field.key] || ""}</div>
              </div>
            ))}
          </div>
          <SectionActions sectionName="Investor Pitch" onRegenerate={() => regenerate("Investor Pitch")} onAction={onActionTrigger} />
        </div>
      </div>

      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 14 }}>
        <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 10 }}>Twitter Thread</div>
        <div style={{ display: "grid", gap: 8 }}>
          {thread.map((tweet, index) => (
            <div key={`${tweet}-${index}`} style={{ display: "grid", gridTemplateColumns: "72px 1fr", alignItems: "start", gap: 10, border: `1px solid ${T.border}`, borderRadius: 10, background: T.surfaceAlt, padding: 10 }}>
              <div style={{ color: T.accent, fontFamily: FONTS.mono, fontSize: 12 }}>{`Tweet ${index + 1}`}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                <div style={{ color: T.text, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{tweet}</div>
                <button
                  type="button"
                  title={`Copy tweet ${index + 1}`}
                  aria-label={`Copy tweet ${index + 1}`}
                  onClick={() => navigator.clipboard.writeText(tweet || "")}
                  style={copyIconBtn}
                >
                  ⧉
                </button>
              </div>
            </div>
          ))}
        </div>
        <SectionActions sectionName="Twitter Thread" onRegenerate={() => regenerate("Twitter Thread")} onAction={onActionTrigger} />
      </div>

      <PanelChat data={panelData} objective={objective} onAction={onActionTrigger} />
      <ActionBar agentId="outreach" data={data} objective={objective} />
    </div>
  );
}
