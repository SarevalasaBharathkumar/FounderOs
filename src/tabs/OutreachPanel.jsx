"use client";
import { useEffect, useState } from "react";
import { callAgentWithPrompt, pushActivity } from "../agents/interactive";
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

  const submit = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput("");
    try {
      const response = await callAgentWithPrompt(
        "outreach",
        `Objective: ${objective}\nCurrent output: ${JSON.stringify(data)}\nFounder says: ${text}`
      );
      setHistory((prev) => [...prev, { founder: text, agent: response }]);
      onAction?.();
    } catch (error) {
      setHistory((prev) => [...prev, { founder: text, agent: { error: error.message } }]);
    } finally {
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
        <button type="button" onClick={submit} disabled={busy} style={{ ...actionBase, fontSize: "0.75rem" }}>
          Send
        </button>
      </div>
      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {history.map((item, index) => (
          <div key={`${item.founder}-${index}`} style={{ display: "grid", gap: 6 }}>
            <div style={{ justifySelf: "end", maxWidth: "85%", background: T.accentGlow, border: `1px solid ${T.accent}`, color: T.text, borderRadius: 10, padding: "8px 10px" }}>{item.founder}</div>
            <div style={{ justifySelf: "start", maxWidth: "85%", background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.dim, borderRadius: 10, padding: "8px 10px", whiteSpace: "pre-wrap" }}>{JSON.stringify(item.agent, null, 2)}</div>
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
          <div style={{ fontFamily: FONTS.display, fontSize: 16 }}>Run an objective to see your roadmap</div>
        </div>
      </div>
    );
  }

  const emails = Array.isArray(panelData.coldEmailSequence) ? panelData.coldEmailSequence.slice(0, 3) : [];
  const linkedInMessage = panelData.linkedInMessage || "";
  const investorPitch = panelData.investorPitch || {};
  const thread = Array.isArray(panelData.twitterThread) ? panelData.twitterThread : [];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 14 }}>
            {emails.map((email, index) => (
              <div key={`${email.subject || "email"}-${index}`} style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surfaceAlt, padding: 14, marginBottom: 8 }}>
                <div style={{ fontFamily: FONTS.mono, color: T.amber, fontSize: 12, marginBottom: 6 }}>Day {email.day}</div>
                <div style={{ color: T.text, fontFamily: FONTS.display, fontWeight: 700, marginBottom: 8 }}>{email.subject}</div>
                <div style={{ color: T.dim, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{email.body}</div>
              </div>
            ))}
            <SectionActions sectionName="Cold Email Sequence" sectionText={JSON.stringify(emails)} onRegenerate={() => regenerate("Cold Email Sequence")} onAction={onActionTrigger} />
          </div>

          <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surfaceAlt, padding: 14 }}>
            <div style={{ color: T.text, fontFamily: FONTS.display, fontWeight: 700, marginBottom: 8 }}>LinkedIn DM</div>
            <div style={{ color: T.dim, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{linkedInMessage}</div>
            <SectionActions sectionName="LinkedIn DM" sectionText={linkedInMessage} onRegenerate={() => regenerate("LinkedIn DM")} onAction={onActionTrigger} />
          </div>
        </div>

        <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 14, display: "grid", gap: 10, alignContent: "start" }}>
          <div style={{ color: T.text, fontFamily: FONTS.display, fontWeight: 700 }}>Investor Pitch</div>
          {[
            ["Hook", investorPitch.hook],
            ["Problem", investorPitch.problem],
            ["Solution", investorPitch.solution],
            ["Traction", investorPitch.traction],
            ["Ask", investorPitch.ask],
          ].map(([label, value]) => (
            <div key={label} style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.surfaceAlt, padding: 10 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: T.accent, marginBottom: 5 }}>{label}</div>
              <div style={{ color: T.text, lineHeight: 1.45 }}>{value || ""}</div>
            </div>
          ))}
          <SectionActions sectionName="Investor Pitch" sectionText={JSON.stringify(investorPitch)} onRegenerate={() => regenerate("Investor Pitch")} onAction={onActionTrigger} />
        </div>
      </div>

      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 14 }}>
        <div style={{ color: T.text, fontFamily: FONTS.display, fontWeight: 700, marginBottom: 10 }}>Twitter Thread</div>
        <div style={{ display: "grid", gap: 8 }}>
          {thread.map((tweet, index) => (
            <div key={`${tweet}-${index}`} style={{ display: "grid", gridTemplateColumns: "72px 1fr", alignItems: "start", gap: 10, border: `1px solid ${T.border}`, borderRadius: 10, background: T.surfaceAlt, padding: 10 }}>
              <div style={{ color: T.accent, fontFamily: FONTS.mono, fontSize: 12 }}>{`Tweet ${index + 1}`}</div>
              <div style={{ color: T.text, lineHeight: 1.45 }}>{tweet}</div>
            </div>
          ))}
        </div>
        <SectionActions sectionName="Twitter Thread" sectionText={thread.join("\n")} onRegenerate={() => regenerate("Twitter Thread")} onAction={onActionTrigger} />
      </div>

      <PanelChat data={panelData} objective={objective} onAction={onActionTrigger} />
    </div>
  );
}
