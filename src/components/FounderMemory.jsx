"use client";
import { useEffect, useState } from "react";
import { FONTS } from "../styles/tokens";

function formatTime(ts) {
  if (!ts) return "";
  const date = new Date(ts);
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${mins}`;
}

export default function FounderMemory({
  refreshTrigger,
  isOpen,
  onToggle,
}) {
  const [objective, setObjective] = useState("");
  const [activity, setActivity] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  void onToggle;

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

  return (
    <>
      <aside
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          height: "100vh",
          width: isOpen ? "280px" : "0px",
          background: "rgba(0,0,0,0.95)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          zIndex: 50,
          transition: "width 0.3s ease, opacity 0.3s ease",
          overflow: "hidden",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#6366f1",
            }}
          >
            ⚡ Founder Memory
          </div>

          <div>
            <div style={{ fontFamily: FONTS.sans, fontSize: "0.65rem", fontWeight: 600, color: "#52525b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              Current Objective
            </div>
            <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10, padding: "0.75rem", fontFamily: FONTS.sans, fontSize: "0.78rem", color: objective ? "#a1a1aa" : "#52525b", lineHeight: 1.5, fontStyle: objective ? "normal" : "italic" }}>
              {objective || "No objective set yet."}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: FONTS.sans, fontSize: "0.65rem", fontWeight: 600, color: "#52525b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              Today's Activity
            </div>
            {activity.length === 0 ? (
              <div style={{ fontFamily: FONTS.sans, fontSize: "0.75rem", color: "#3f3f46", fontStyle: "italic", textAlign: "center", padding: "1rem 0" }}>
                No activity yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {activity.map((entry, index) => (
                  <div key={`${entry.section}-${index}`} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: index < activity.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, fontSize: "0.9rem" }}>
                      {entry.type === "done" ? "✓" : entry.type === "copy" ? "📋" : entry.type === "regenerate" ? "🔄" : "•"}
                    </span>
                    <span style={{ fontFamily: FONTS.sans, fontSize: "0.72rem", color: "#71717a", lineHeight: 1.4, flex: 1 }}>
                      {entry.section}
                    </span>
                    <span style={{ fontFamily: FONTS.sans, fontSize: "0.62rem", color: "#3f3f46", flexShrink: 0 }}>
                      {formatTime(entry.ts)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontFamily: FONTS.sans, fontSize: "0.65rem", fontWeight: 600, color: "#52525b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              Completed Tasks
            </div>
            {completedTasks.length === 0 ? (
              <div style={{ fontFamily: FONTS.sans, fontSize: "0.75rem", color: "#3f3f46", fontStyle: "italic", textAlign: "center", padding: "1rem 0" }}>
                No completed tasks yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {completedTasks.map((task) => (
                  <div key={task} style={{ fontFamily: FONTS.sans, fontSize: "0.72rem", color: "#3f3f46", textDecoration: "line-through", lineHeight: 1.4 }}>
                    {task}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
