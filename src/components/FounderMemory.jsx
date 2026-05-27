"use client";
import { useEffect, useState } from "react";
import { FONTS, T } from "../styles/tokens";

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString();
}

export default function FounderMemory({ refreshTrigger, expanded, onToggle }) {
  const [objective, setObjective] = useState("");
  const [activity, setActivity] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    const storedObjective = localStorage.getItem("founderos-objective") || "";
    const storedActivity = JSON.parse(localStorage.getItem("founderos-activity") || "[]");
    const storedTasks = JSON.parse(localStorage.getItem("founderos-tasks") || '{"checked":{}}');

    setObjective(storedObjective);
    setActivity(storedActivity);

    const checked = storedTasks?.checked || {};
    const labels = storedTasks?.labels || {};
    const taskNames = Object.entries(checked)
      .filter(([, done]) => !!done)
      .map(([taskId]) => labels[taskId] || taskId);
    setCompletedTasks(taskNames);
  }, [refreshTrigger]);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => onToggle(true)}
        style={{
          position: "fixed",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          border: `1px solid ${T.border}`,
          borderRight: "none",
          borderRadius: "10px 0 0 10px",
          background: T.surface,
          color: T.accent,
          padding: "10px 8px",
          zIndex: 60,
          cursor: "pointer",
        }}
      >
        ⚡
      </button>
    );
  }

  return (
    <aside
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        width: 260,
        height: "100vh",
        background: T.surface,
        borderLeft: `1px solid ${T.border}`,
        zIndex: 50,
        padding: "1.2rem",
        overflowY: "auto",
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(false)}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          border: `1px solid ${T.border}`,
          background: T.surfaceAlt,
          color: T.dim,
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        ←
      </button>

      <div style={{ color: T.accent, fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 16 }}>
        ⚡ Founder Memory
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ color: T.text, fontFamily: FONTS.display, fontWeight: 700, marginBottom: 8 }}>Current Objective</div>
        <div style={{ color: T.dim, lineHeight: 1.45 }}>{objective || "No objective set yet."}</div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ color: T.text, fontFamily: FONTS.display, fontWeight: 700, marginBottom: 8 }}>Today's Activity</div>
        {activity.length === 0 ? (
          <div style={{ color: T.dim, lineHeight: 1.45 }}>No activity yet. Launch your first objective.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {activity.map((entry, index) => {
              const styleMap = {
                done: { icon: "✓", color: T.green },
                copy: { icon: "📋", color: T.amber },
                regenerate: { icon: "🔄", color: T.accent },
              };
              const current = styleMap[entry.type] || { icon: "•", color: T.dim };
              return (
                <div key={`${entry.section}-${index}`} style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.surfaceAlt, padding: 8 }}>
                  <div style={{ color: current.color }}>{current.icon}</div>
                  <div style={{ color: T.text, fontSize: 13 }}>{entry.section}</div>
                  <div style={{ color: T.dim, fontFamily: FONTS.mono, fontSize: 11 }}>{formatTime(entry.ts)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div style={{ color: T.text, fontFamily: FONTS.display, fontWeight: 700, marginBottom: 8 }}>Completed Tasks</div>
        {completedTasks.length === 0 ? (
          <div style={{ color: T.dim }}>No completed tasks yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {completedTasks.map((task) => (
              <div key={task} style={{ color: T.muted, textDecoration: "line-through" }}>
                {task}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
