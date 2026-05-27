"use client";

import { T, FONTS } from "../../styles/tokens";
import ExportNotionButton from "./buttons/ExportNotionButton";
import DownloadRoadmapButton from "./buttons/DownloadRoadmapButton";
import GenerateValidationSprintButton from "./buttons/GenerateValidationSprintButton";
import GenerateICPSheetButton from "./buttons/GenerateICPSheetButton";
import GenerateLandingPageButton from "./buttons/GenerateLandingPageButton";
import CopyPositioningButton from "./buttons/CopyPositioningButton";
import OpenInGmailButton from "./buttons/OpenInGmailButton";
import CopyEmailSequenceButton from "./buttons/CopyEmailSequenceButton";
import CopyInvestorPitchButton from "./buttons/CopyInvestorPitchButton";
import CopyTwitterThreadButton from "./buttons/CopyTwitterThreadButton";
import DownloadRiskRegisterButton from "./buttons/DownloadRiskRegisterButton";
import GenerateValidationChecklistButton from "./buttons/GenerateValidationChecklistButton";
import CopyDiscoveryScriptButton from "./buttons/CopyDiscoveryScriptButton";

const styles = {
  container: {
    borderTop: "1px solid rgba(255,255,255,0.06)",
    marginTop: "1.5rem",
    paddingTop: "1.5rem",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
  },
  label: {
    fontFamily: FONTS.sans,
    fontWeight: 600,
    fontSize: "0.62rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: T.muted,
  },
  codexPill: {
    background: "rgba(99,102,241,0.08)",
    border: "1px solid rgba(99,102,241,0.15)",
    color: T.accentBright,
    fontFamily: FONTS.sans,
    fontSize: "0.6rem",
    fontWeight: 500,
    padding: "2px 8px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "0.75rem",
  },
};

function ActionBar({ agentId, data, objective }) {
  if (data == null) {
    return null;
  }

  const buttonsByAgent = {
    strategist: [
      <ExportNotionButton key="export-notion" data={data} objective={objective} />,
      <DownloadRoadmapButton key="download-roadmap" data={data} objective={objective} />,
      <GenerateValidationSprintButton key="validation-sprint" data={data} objective={objective} />,
    ],
    gtm: [
      <GenerateICPSheetButton key="generate-icp" data={data} objective={objective} />,
      <GenerateLandingPageButton key="generate-landing-page" data={data} objective={objective} />,
      <CopyPositioningButton key="copy-positioning" data={data} />,
    ],
    outreach: [
      <OpenInGmailButton key="open-in-gmail" data={data} />,
      <CopyEmailSequenceButton key="copy-email-sequence" data={data} />,
      <CopyInvestorPitchButton key="copy-investor-pitch" data={data} />,
      <CopyTwitterThreadButton key="copy-twitter-thread" data={data} />,
    ],
    risk: [
      <DownloadRiskRegisterButton key="download-risk-register" data={data} objective={objective} />,
      <GenerateValidationChecklistButton key="validation-checklist" data={data} objective={objective} />,
      <CopyDiscoveryScriptButton key="copy-discovery-script" data={data} objective={objective} />,
    ],
  };

  const actionButtons = buttonsByAgent[agentId] || [];

  if (actionButtons.length === 0) {
    return null;
  }

  return (
    <section style={styles.container}>
      <div style={styles.headerRow}>
        <div style={styles.label}>? AGENT ACTIONS</div>
        <div style={styles.codexPill}>Powered by Codex</div>
      </div>

      <div style={styles.buttonRow}>{actionButtons}</div>
    </section>
  );
}

export default ActionBar;
