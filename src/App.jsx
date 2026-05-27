"use client";
import { useMemo, useState } from "react";
import { orchestrate } from "./agents/orchestrator";
import AgentStatusRow from "./components/AgentStatusRow";
import Console from "./components/Console";
import FounderMemory from "./components/FounderMemory";
import Header from "./components/Header";
import ObjectiveInput from "./components/ObjectiveInput";
import GTMPanel from "./tabs/GTMPanel";
import OutreachPanel from "./tabs/OutreachPanel";
import RiskPanel from "./tabs/RiskPanel";
import RoadmapPanel from "./tabs/RoadmapPanel";
import { FONT_IMPORT, FONTS, T } from "./styles/tokens";

const TABS = [
  { key: "roadmap", label: "Roadmap ⚡", agentId: "strategist", Component: RoadmapPanel },
  { key: "gtm", label: "GTM 🎯", agentId: "gtm", Component: GTMPanel },
  { key: "outreach", label: "Outreach 📨", agentId: "outreach", Component: OutreachPanel },
  { key: "risk", label: "Risk 🛡️", agentId: "risk", Component: RiskPanel },
];

export default function App() {
  const [objective, setObjective] = useState("");
  const [running, setRunning] = useState(false);
  const [agentStates, setAgentStates] = useState({});
  const [results, setResults] = useState({});
  const [activeTab, setActiveTab] = useState("roadmap");
  const [logs, setLogs] = useState([]);
  const [showConsole, setShowConsole] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [memoryExpanded, setMemoryExpanded] = useState(true);

  const activeTabConfig = useMemo(
    () => TABS.find((tab) => tab.key === activeTab) || TABS[0],
    [activeTab]
  );

  const handleLaunch = async () => {
    if (!objective.trim() || running) {
      return;
    }

    setResults({});
    setAgentStates({});
    setLogs([]);
    setShowConsole(true);
    setRunning(true);
    setRefreshTrigger((prev) => prev + 1);

    try {
      const data = await orchestrate(objective, setAgentStates, setLogs);
      setResults(data || {});
    } finally {
      setRunning(false);
    }
  };

  const ActivePanel = activeTabConfig.Component;
  const activeAgentId = activeTabConfig.agentId;
  const activeData = results[activeAgentId] || null;
  const activeLoading = running && !results[activeAgentId];

  const handleDataPatch = (agentId, updated) => {
    setResults((prev) => ({ ...prev, [agentId]: updated }));
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleActionTrigger = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleObjectiveChange = (value) => {
    setObjective(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("founderos-objective", value);
    }
  };

  return (
    <div
      className="app-shell"
      style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.text,
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <style>{FONT_IMPORT}</style>
      <style>{`
        .app-shell::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            radial-gradient(${T.accentGlow} 1px, transparent 1px),
            radial-gradient(${T.accentGlow} 1px, transparent 1px);
          background-size: 22px 22px, 22px 22px;
          background-position: 0 0, 11px 11px;
          opacity: 0.22;
          z-index: 0;
        }
      `}</style>

      <div style={{ position: "relative", zIndex: 1, marginRight: memoryExpanded ? 260 : 0, transition: "margin-right 0.2s ease" }}>
        <Header />
        <ObjectiveInput
          objective={objective}
          setObjective={handleObjectiveChange}
          onLaunch={handleLaunch}
          running={running}
        />
        <AgentStatusRow agentStates={agentStates} />
        {showConsole ? <Console logs={logs} /> : null}

        <section style={{ maxWidth: 1100, margin: "18px auto 28px", padding: "0 16px" }}>
          <nav
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              borderBottom: `1px solid ${T.border}`,
              marginBottom: 14,
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const isDone = agentStates?.[tab.agentId]?.status === "done";

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    border: "none",
                    borderBottom: `2px solid ${isActive ? T.accent : "transparent"}`,
                    background: "transparent",
                    color: isActive ? T.accent : T.dim,
                    padding: "10px 8px",
                    cursor: "pointer",
                    fontFamily: FONTS.mono,
                    fontSize: 13,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {tab.label}
                  {isDone ? (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: T.green,
                        boxShadow: `0 0 8px ${T.green}`,
                      }}
                    />
                  ) : null}
                </button>
              );
            })}
          </nav>

          <ActivePanel
            data={activeData}
            loading={activeLoading}
            objective={objective}
            onDataPatch={handleDataPatch}
            onActionTrigger={handleActionTrigger}
          />
        </section>
      </div>
      <FounderMemory refreshTrigger={refreshTrigger} expanded={memoryExpanded} onToggle={setMemoryExpanded} />
    </div>
  );
}
