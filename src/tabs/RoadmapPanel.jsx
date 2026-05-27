"use client";
import { useEffect, useMemo, useState } from "react";
import { callAgentWithPrompt, getTaskStorage, pushActivity, setTaskStorage } from "../agents/interactive";
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

function flattenTasks(phases) {
  const items = [];
  (Array.isArray(phases) ? phases : []).forEach((phase, phaseIndex) => {
    (Array.isArray(phase.tasks) ? phase.tasks : []).forEach((task, taskIndex) => {
      const id = `${phase.phase || "phase"}-${phaseIndex}-${taskIndex}`;
      items.push({ id, text: task, phase: phase.phase || `Phase ${phaseIndex + 1}` });
    });
  });
  return items;
}

function extractNewTasks(parsed) {
  const fromPhases = flattenTasks(parsed?.phases).map((task) => task.text);
  return fromPhases.filter(Boolean);
}

function SectionActions({ sectionName, sectionText, onRegenerate, onDone, onAction }) {
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);

  const copySection = async () => {
    try {
      await navigator.clipboard.writeText(sectionText || "");
      setCopied(true);
      pushActivity("copy", sectionName);
      onAction();
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const markDone = () => {
    setDone(true);
    pushActivity("done", sectionName);
    onAction();
    onDone?.();
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
        "strategist",
        `Objective: ${objective}\nCurrent output: ${JSON.stringify(data)}\nFounder says: ${text}`
      );
      setHistory((prev) => [...prev, { founder: text, agent: response }]);
      onAction();
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
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
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
        <button type="button" onClick={submit} disabled={busy} style={{ ...actionBase, fontSize: "0.75rem" }}>
          Send
        </button>
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {history.map((item, index) => (
          <div key={`${item.founder}-${index}`} style={{ display: "grid", gap: 6 }}>
            <div
              style={{
                justifySelf: "end",
                maxWidth: "85%",
                background: T.accentGlow,
                border: `1px solid ${T.accent}`,
                color: T.text,
                borderRadius: 10,
                padding: "8px 10px",
              }}
            >
              {item.founder}
            </div>
            <div
              style={{
                justifySelf: "start",
                maxWidth: "85%",
                background: T.surfaceAlt,
                border: `1px solid ${T.border}`,
                color: T.dim,
                borderRadius: 10,
                padding: "8px 10px",
                whiteSpace: "pre-wrap",
              }}
            >
              {JSON.stringify(item.agent, null, 2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RoadmapPanel({ data, loading, objective = "", onDataPatch, onActionTrigger }) {
  const [panelData, setPanelData] = useState(data);
  const [checkedMap, setCheckedMap] = useState({});
  const [labelsMap, setLabelsMap] = useState({});
  const [nextSteps, setNextSteps] = useState([]);
  const [expanding, setExpanding] = useState(false);

  useEffect(() => {
    setPanelData(data);
  }, [data]);

  const taskList = useMemo(() => flattenTasks(panelData?.phases), [panelData]);

  useEffect(() => {
    const stored = getTaskStorage();
    if (stored.objective === objective) {
      setCheckedMap(stored.checked || {});
      setLabelsMap(stored.labels || {});
      setNextSteps(stored.nextSteps || []);
      return;
    }

    const reset = { checked: {}, labels: {}, nextSteps: [], objective };
    setTaskStorage(reset);
    setCheckedMap({});
    setLabelsMap({});
    setNextSteps([]);
  }, [objective]);

  const persistTasks = (checked, labels, steps) => {
    setTaskStorage({ checked, labels, nextSteps: steps, objective });
  };

  const patchData = (patch) => {
    const updated = { ...(panelData || {}), ...patch };
    setPanelData(updated);
    onDataPatch?.("strategist", updated);
  };

  const regenerateSection = async (sectionName) => {
    try {
      const response = await callAgentWithPrompt(
        "strategist",
        `Objective: ${objective}\nCurrent output: ${JSON.stringify(panelData)}\nRegenerate only this section with a stronger, more specific angle: ${sectionName}`
      );
      const nextData = { ...(panelData || {}) };
      if (sectionName === "Summary" && response.summary) nextData.summary = response.summary;
      if (sectionName === "Task Board" && response.phases) nextData.phases = response.phases;
      if (sectionName === "Risks" && response.risks) nextData.risks = response.risks;
      if (sectionName === "Quick Wins" && response.quickWins) nextData.quickWins = response.quickWins;
      setPanelData(nextData);
      onDataPatch?.("strategist", nextData);
      pushActivity("regenerate", sectionName);
      onActionTrigger?.();
    } catch {
      return;
    }
  };

  const handleToggleTask = async (task) => {
    const nextChecked = { ...checkedMap, [task.id]: !checkedMap[task.id] };
    const nextLabels = { ...labelsMap, [task.id]: task.text };
    setCheckedMap(nextChecked);
    setLabelsMap(nextLabels);
    persistTasks(nextChecked, nextLabels, nextSteps);

    const completed = taskList.filter((item) => nextChecked[item.id]).map((item) => item.text);
    if (completed.length === 0 || expanding) return;

    setExpanding(true);
    try {
      const response = await callAgentWithPrompt(
        "strategist",
        `Startup objective: ${objective}\nThese tasks are done: ${JSON.stringify(
          completed
        )}. What should the founder do next? Return JSON only.`
      );
      const appended = extractNewTasks(response);
      const merged = [...nextSteps, ...appended.filter((item) => !nextSteps.includes(item))];
      setNextSteps(merged);
      persistTasks(nextChecked, nextLabels, merged);
    } catch {
      return;
    } finally {
      setExpanding(false);
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
      <div
        style={{
          minHeight: 260,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          border: `1px dashed ${T.border}`,
          borderRadius: 14,
          background: T.surface,
          color: T.dim,
          padding: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 34, opacity: 0.35, marginBottom: 10 }}>⚡</div>
          <div style={{ fontFamily: FONTS.display, fontSize: 16 }}>Run an objective to see your roadmap</div>
        </div>
      </div>
    );
  }

  const risks = Array.isArray(panelData.risks) ? panelData.risks : [];
  const quickWins = Array.isArray(panelData.quickWins) ? panelData.quickWins : [];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div
        style={{
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          background: T.surface,
          padding: 16,
          color: T.text,
          fontStyle: "italic",
          lineHeight: 1.5,
        }}
      >
        {panelData.summary}
        <SectionActions
          sectionName="Summary"
          sectionText={panelData.summary}
          onRegenerate={() => regenerateSection("Summary")}
          onAction={onActionTrigger}
        />
      </div>

      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surfaceAlt, padding: 14 }}>
        <div style={{ color: T.text, fontFamily: FONTS.display, fontWeight: 700, marginBottom: 8 }}>Task Board</div>
        <div style={{ display: "grid", gap: 8 }}>
          {taskList.map((task) => {
            const done = !!checkedMap[task.id];
            return (
              <label key={task.id} style={{ display: "flex", gap: 10, alignItems: "start", color: done ? T.muted : T.text }}>
                <input type="checkbox" checked={done} onChange={() => handleToggleTask(task)} />
                <span style={{ textDecoration: done ? "line-through" : "none" }}>{task.text}</span>
              </label>
            );
          })}
        </div>
        {nextSteps.length > 0 ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ color: T.accent, fontFamily: FONTS.mono, marginBottom: 6 }}>Next Steps</div>
            <div style={{ display: "grid", gap: 6 }}>
              {nextSteps.map((step, index) => (
                <div key={`${step}-${index}`} style={{ color: T.text }}>{`→ ${step}`}</div>
              ))}
            </div>
          </div>
        ) : null}
        <SectionActions
          sectionName="Task Board"
          sectionText={`${taskList.map((task) => task.text).join("\n")}\n${nextSteps.join("\n")}`}
          onRegenerate={() => regenerateSection("Task Board")}
          onAction={onActionTrigger}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 14 }}>
          <div style={{ color: T.text, fontFamily: FONTS.display, fontWeight: 700, marginBottom: 10 }}>Risks</div>
          <div style={{ display: "grid", gap: 8 }}>
            {risks.map((risk, index) => (
              <div key={`${risk}-${index}`} style={{ color: T.text, display: "flex", alignItems: "start", gap: 8 }}>
                <span style={{ color: T.red, lineHeight: 1 }}>●</span>
                <span>{risk}</span>
              </div>
            ))}
          </div>
          <SectionActions
            sectionName="Risks"
            sectionText={risks.join("\n")}
            onRegenerate={() => regenerateSection("Risks")}
            onAction={onActionTrigger}
          />
        </div>

        <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.surface, padding: 14 }}>
          <div style={{ color: T.text, fontFamily: FONTS.display, fontWeight: 700, marginBottom: 10 }}>Quick Wins</div>
          <div style={{ display: "grid", gap: 8 }}>
            {quickWins.map((item, index) => (
              <div key={`${item}-${index}`} style={{ color: T.text, display: "flex", alignItems: "start", gap: 8 }}>
                <span style={{ color: T.green, lineHeight: 1 }}>●</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <SectionActions
            sectionName="Quick Wins"
            sectionText={quickWins.join("\n")}
            onRegenerate={() => regenerateSection("Quick Wins")}
            onAction={onActionTrigger}
          />
        </div>
      </div>

      <PanelChat data={panelData} objective={objective} onAction={onActionTrigger} />
    </div>
  );
}
