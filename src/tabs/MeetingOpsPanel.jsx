"use client";
import { useEffect, useMemo, useState } from "react";
import { FONTS, T } from "../styles/tokens";

const box = {
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  background: T.surface,
  padding: 12,
};

const inputStyle = {
  width: "100%",
  background: T.surfaceAlt,
  border: `1px solid ${T.border}`,
  color: T.text,
  borderRadius: 10,
  padding: "10px 12px",
  outline: "none",
};

const statuses = ["queued", "joining", "recording", "transcript_ready", "summarizing", "extracted"];

export default function MeetingOpsPanel() {
  const [view, setView] = useState("live");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [session, setSession] = useState(null);
  const [botIdInput, setBotIdInput] = useState("");
  const [externalTranscript, setExternalTranscript] = useState([]);
  const [externalProviderState, setExternalProviderState] = useState(null);
  const [loadingBotTranscript, setLoadingBotTranscript] = useState(false);
  const [recentSummaries, setRecentSummaries] = useState([]);
  const [selectedSummaryId, setSelectedSummaryId] = useState("");
  const [botTranscripts, setBotTranscripts] = useState({});
  const [owners, setOwners] = useState([]);
  const [ownerDraft, setOwnerDraft] = useState({ name: "", email: "", notionUserId: "", active: true });
  const [savingOwner, setSavingOwner] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const parseApiResponse = async (res) => {
    const text = await res.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }
    return {
      ok: res.ok,
      status: res.status,
      data: payload,
      text,
    };
  };

  const loadOwners = async () => {
    try {
      const res = await fetch("/api/meeting/owners");
      const parsed = await parseApiResponse(res);
      if (!parsed.ok) {
        setError(parsed.data?.error || `Failed to load owners (${parsed.status})`);
        return;
      }
      setOwners(parsed.data?.owners || []);
    } catch {
      setError("Failed to load owners");
    }
  };

  const loadRecentSummaries = async () => {
    try {
      const res = await fetch("/api/meeting/sessions?limit=30");
      const parsed = await parseApiResponse(res);
      if (!parsed.ok) return;
      const sessions = Array.isArray(parsed.data?.sessions) ? parsed.data.sessions : [];
      setRecentSummaries(sessions.slice(0, 30));
    } catch {
      // no-op
    }
  };

  const loadSession = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/meeting/sessions/${id}`);
      const parsed = await parseApiResponse(res);
      if (parsed.ok) {
        setSession(parsed.data);
        loadRecentSummaries();
        
        // Store bot ID if available
        if (parsed.data?.providerMeetingId) {
          storeBotId(parsed.data.providerMeetingId);
        }
      }
    } catch {
      setError("Failed to load session");
    }
  };

  const storeBotId = (botId) => {
    if (!botId || typeof window === "undefined") return;
    try {
      const stored = JSON.parse(localStorage.getItem("founderos-bot-ids") || "[]");
      if (!Array.isArray(stored)) return;
      
      // Add bot ID if not already in list (keep last 20)
      if (!stored.includes(botId)) {
        stored.unshift(botId);
        if (stored.length > 20) stored.pop();
        localStorage.setItem("founderos-bot-ids", JSON.stringify(stored));
      }
    } catch (err) {
      console.error("[storeBotId] Error:", err);
    }
  };

  const loadBotTranscript = async (botId) => {
    if (!botId || botTranscripts[botId]) return; // Skip if already loaded
    try {
      const res = await fetch(`/api/meeting/provider/${botId}`);
      const parsed = await parseApiResponse(res);
      if (parsed.ok && parsed.data?.transcriptChunks?.length > 0) {
        setBotTranscripts((prev) => ({
          ...prev,
          [botId]: parsed.data.transcriptChunks,
        }));
      }
    } catch (err) {
      console.error(`[loadBotTranscript] Error loading ${botId}:`, err);
    }
  };

  const loadAllBotTranscripts = async () => {
    if (typeof window === "undefined") return;
    try {
      const stored = JSON.parse(localStorage.getItem("founderos-bot-ids") || "[]");
      if (!Array.isArray(stored)) return;
      
      // Load transcripts for all stored bot IDs
      stored.forEach((botId) => loadBotTranscript(botId));
    } catch (err) {
      console.error("[loadAllBotTranscripts] Error:", err);
    }
  };

  useEffect(() => {
    loadOwners();
    loadRecentSummaries();
    const rememberedSessionId = typeof window !== "undefined" ? localStorage.getItem("founderos-meeting-session-id") : "";
    if (rememberedSessionId) {
      setSessionId(rememberedSessionId);
    }
  }, []);

  useEffect(() => {
    let t = null;
    if (sessionId) {
      t = setInterval(() => loadSession(sessionId), 5000);
      loadSession(sessionId);
    }
    return () => t && clearInterval(t);
  }, [sessionId]);

  // Force re-render when transcript becomes available
  useEffect(() => {
    // Ensures component re-renders when session transcript data or external transcript arrives
    // This allows the UI to update immediately when webhooks deliver transcript chunks
  }, [session?.transcriptChunks, externalTranscript]);

  // Load bot transcripts when switching to summaries view
  useEffect(() => {
    if (view === "summaries") {
      loadAllBotTranscripts();
    }
  }, [view]);

  const startSession = async () => {
    setError("");
    try {
      const res = await fetch("/api/meeting/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingUrl }),
      });
      const parsed = await parseApiResponse(res);
      if (!parsed.ok) {
        const details = parsed.data?.details || parsed.text || "";
        setError(parsed.data?.error || `Failed to start meeting bot (${parsed.status})`);
        setDebugInfo(details ? String(details) : "");
        return;
      }
      setSessionId(parsed.data?.sessionId || "");
      if (parsed.data?.sessionId && typeof window !== "undefined") {
        localStorage.setItem("founderos-meeting-session-id", parsed.data.sessionId);
      }
      if (parsed.data?.providerMeetingId && typeof window !== "undefined") {
        localStorage.setItem("founderos-meeting-provider-id", parsed.data.providerMeetingId);
      }
      setDebugInfo(parsed.data?.debug ? JSON.stringify(parsed.data.debug, null, 2) : "");
    } catch {
      setError("Failed to start meeting bot");
    }
  };

  const saveOwner = async () => {
    setSavingOwner(true);
    setError("");
    try {
      const res = await fetch("/api/meeting/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ownerDraft),
      });
      const parsed = await parseApiResponse(res);
      if (parsed.ok) {
        setOwnerDraft({ name: "", email: "", notionUserId: "", active: true });
        loadOwners();
        return;
      }
      setError(parsed.data?.error || `Failed to save owner (${parsed.status})`);
      setDebugInfo(parsed.data?.details ? String(parsed.data.details) : "");
    } catch {
      setError("Failed to save owner");
    } finally {
      setSavingOwner(false);
    }
  };

  const updateTask = (idx, key, value) => {
    setSession((prev) => {
      if (!prev?.output?.tasks) return prev;
      const tasks = [...prev.output.tasks];
      tasks[idx] = { ...tasks[idx], [key]: value };
      return { ...prev, output: { ...prev.output, tasks } };
    });
  };

  const publish = async () => {
    if (!session?.id) return;
    setPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/meeting/sessions/${session.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: session.output?.tasks || [],
          decisions: session.output?.decisions || [],
          reminderEnabled,
        }),
      });
      const parsed = await parseApiResponse(res);
      if (!parsed.ok) {
        const unmapped = Array.isArray(parsed.data?.unmappedOwners) ? parsed.data.unmappedOwners.filter(Boolean) : [];
        const ownerHint = unmapped.length ? ` Unmapped owners: ${unmapped.join(", ")}.` : "";
        setError(`${parsed.data?.error || `Publish failed (${parsed.status})`}${ownerHint}`);
        setDebugInfo(parsed.data?.details ? String(parsed.data.details) : "");
        return;
      }
      await loadSession(session.id);
    } catch {
      setError("Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const loadTranscriptByBotId = async () => {
    const botId = String(botIdInput || "").trim();
    if (!botId) {
      setError("Enter a bot ID");
      return;
    }
    setLoadingBotTranscript(true);
    setError("");
    setDebugInfo("");
    try {
      const res = await fetch(`/api/meeting/provider/${botId}`);
      const parsed = await parseApiResponse(res);
      if (!parsed.ok) {
        setError(parsed.data?.error || `Failed to load transcript by bot ID (${parsed.status})`);
        setDebugInfo(parsed.data?.details ? String(parsed.data.details) : "");
        return;
      }
      const chunks = Array.isArray(parsed.data?.transcriptChunks) ? parsed.data.transcriptChunks : [];
      console.log("[loadTranscriptByBotId] Loaded chunks:", { count: chunks.length, first: chunks[0] });
      setExternalTranscript(chunks);
      setExternalProviderState(parsed.data?.providerState || null);
      if (chunks.length === 0) {
        console.warn("[loadTranscriptByBotId] Warning: No transcript chunks returned. Meeting may still be processing or recording.");
      } else {
        console.log(`[loadTranscriptByBotId] Successfully loaded ${chunks.length} transcript chunks`);
      }
      if (typeof window !== "undefined") localStorage.setItem("founderos-meeting-provider-id", botId);
    } catch (err) {
      console.error("[loadTranscriptByBotId] Error:", err);
      setError("Failed to load transcript by bot ID");
      setDebugInfo(err?.message || "");
    } finally {
      setLoadingBotTranscript(false);
    }
  };

  const summarizeSession = async () => {
    if (!session?.id) return;
    setSummarizing(true);
    setError("");
    try {
      const res = await fetch(`/api/meeting/sessions/${session.id}/summarize`, { method: "POST" });
      const parsed = await parseApiResponse(res);
      if (!parsed.ok) {
        setError(parsed.data?.error || `Failed to summarize (${parsed.status})`);
        setDebugInfo(parsed.data?.details ? String(parsed.data.details) : "");
        return;
      }
      await loadSession(session.id);
    } catch {
      setError("Failed to summarize transcript");
    } finally {
      setSummarizing(false);
    }
  };

  const deleteSummary = async (id) => {
    try {
      const res = await fetch(`/api/meeting/sessions/${id}`, { method: "DELETE" });
      const parsed = await parseApiResponse(res);
      if (!parsed.ok) {
        setError(parsed.data?.error || `Failed to delete summary (${parsed.status})`);
        return;
      }
      if (sessionId === id) {
        setSessionId("");
        setSession(null);
        if (typeof window !== "undefined") localStorage.removeItem("founderos-meeting-session-id");
      }
      if (selectedSummaryId === id) setSelectedSummaryId("");
      loadRecentSummaries();
    } catch {
      setError("Failed to delete summary");
    }
  };

  const effectiveStatus = useMemo(() => {
    if (summarizing) return "summarizing";
    return session?.status || "queued";
  }, [session?.status, summarizing]);

  const statusIndex = useMemo(() => statuses.indexOf(effectiveStatus), [effectiveStatus]);
  const selectedSummary = useMemo(
    () => recentSummaries.find((s) => s.id === selectedSummaryId) || null,
    [recentSummaries, selectedSummaryId]
  );
  const isSummaryLoading = useMemo(() => {
    return summarizing;
  }, [summarizing]);
  const transcriptUnavailableReason = useMemo(() => {
    return session?.providerState?.transcriptReason || "";
  }, [session]);
  const liveRecentSummary = useMemo(
    () => session?.output?.meetingSummary || recentSummaries.find((s) => s?.output?.meetingSummary)?.output?.meetingSummary || "",
    [session, recentSummaries]
  );
  const hasTranscript = useMemo(() => {
    const sessionChunks = session?.transcriptChunks?.length || 0;
    const externalChunks = externalTranscript?.length || 0;
    const available = sessionChunks > 0 || externalChunks > 0;
    if (!available && (sessionChunks === 0 || externalChunks === 0)) {
      console.log("[transcript] Not available:", { sessionChunks, externalChunks, status: session?.status });
    }
    return available;
  }, [session?.transcriptChunks, externalTranscript, session?.status]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={box}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setView("live")}
            style={{
              ...inputStyle,
              width: "auto",
              borderColor: view === "live" ? T.accent : T.border,
              color: view === "live" ? T.accentBright : T.textSub,
              cursor: "pointer",
            }}
          >
            Live Meeting Ops
          </button>
          <button
            type="button"
            onClick={() => {
              setView("summaries");
              loadRecentSummaries();
            }}
            style={{
              ...inputStyle,
              width: "auto",
              borderColor: view === "summaries" ? T.accent : T.border,
              color: view === "summaries" ? T.accentBright : T.textSub,
              cursor: "pointer",
            }}
          >
            Your Meeting Summaries
          </button>
        </div>
      </div>

      {view === "summaries" ? (
        <div style={{ ...box, display: "grid", gap: 8 }}>
          <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700 }}>Your Meeting Summaries</div>
          {recentSummaries.length === 0 ? (
            <div style={{ color: T.textSub, fontSize: 13 }}>No extracted meetings yet.</div>
          ) : (
            recentSummaries.map((item) => (
              <div key={item.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.surfaceAlt, padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedSummaryId(item.id)}
                    style={{
                      textAlign: "left",
                      border: "none",
                      background: "transparent",
                      color: T.textSub,
                      fontSize: 12,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {item.status} - {item.createdAt}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSummary(item.id)}
                    style={{ ...inputStyle, width: 80, padding: "4px 8px", fontSize: 12, cursor: "pointer", color: T.red }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45, color: T.textSub }}>
                  {item.output?.meetingSummary || "Summary not extracted yet."}
                </div>
              </div>
            ))
          )}
          {selectedSummary ? (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 10, background: T.surface }}>
              <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 6 }}>Summary Detail</div>
              <div style={{ color: T.textSub, lineHeight: 1.5 }}>{selectedSummary.output?.meetingSummary || "No summary."}</div>
              <div style={{ color: T.dim, fontSize: 12, marginTop: 8 }}>
                {(selectedSummary.output?.tasks || []).length} tasks - {(selectedSummary.output?.decisions || []).length} decisions
              </div>
              
              {/* Display transcript for this summary if available */}
              {selectedSummary.providerMeetingId && botTranscripts[selectedSummary.providerMeetingId] ? (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                  <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
                    Meeting Transcript
                  </div>
                  <div
                    style={{
                      border: `1px solid ${T.border}`,
                      borderRadius: 8,
                      background: T.surfaceAlt,
                      maxHeight: 200,
                      overflowY: "auto",
                      padding: 8,
                    }}
                  >
                    {botTranscripts[selectedSummary.providerMeetingId].map((chunk, idx) => (
                      <div key={`${chunk.ts}_${idx}`} style={{ color: T.textSub, fontSize: 12, lineHeight: 1.4, marginBottom: 4 }}>
                        {chunk.speaker ? <strong>{chunk.speaker}:</strong> : null} {chunk.text}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {view !== "live" ? null : (
        <>
          <div style={box}>
          <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 10 }}>Meeting Ops</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
              <input
                style={inputStyle}
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="Paste Google Meet link..."
              />
            <button type="button" onClick={startSession} style={{ ...inputStyle, width: 170, cursor: "pointer" }}>
              Start Meeting Bot
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 8 }}>
            <input
              style={inputStyle}
              value={botIdInput}
              onChange={(e) => setBotIdInput(e.target.value)}
              placeholder="Or paste Recall Bot ID to load transcript..."
            />
            <button type="button" onClick={loadTranscriptByBotId} disabled={loadingBotTranscript} style={{ ...inputStyle, width: 190, cursor: "pointer" }}>
              {loadingBotTranscript ? "Loading..." : "Load Transcript by Bot ID"}
            </button>
          </div>
          {externalProviderState ? (
            <div style={{ color: T.textSub, marginTop: 8, fontSize: 12 }}>
              Provider state: {externalProviderState.code || "unknown"} {externalProviderState.subCode ? `(${externalProviderState.subCode})` : ""}
            </div>
          ) : null}
          <div style={{ marginTop: 10 }}>
            <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 6 }}>Transcript</div>
            {!hasTranscript ? (
              <div style={{ color: T.textSub, fontSize: 13 }}>
                {transcriptUnavailableReason || "Transcript not available yet."}
              </div>
            ) : (
              <div
                style={{
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  background: T.surfaceAlt,
                  maxHeight: 240,
                  overflowY: "auto",
                  padding: 10,
                }}
              >
                {(session?.transcriptChunks?.length ? session.transcriptChunks : externalTranscript).map((chunk, idx) => (
                  <div key={`${chunk.ts}_${idx}`} style={{ color: T.textSub, fontSize: 13, lineHeight: 1.45, marginBottom: 6 }}>
                    {chunk.speaker ? `${chunk.speaker}: ` : ""}{chunk.text}
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={summarizeSession}
              disabled={summarizing || !session?.transcriptChunks?.length}
              style={{ ...inputStyle, width: 180, cursor: "pointer", marginTop: 8 }}
            >
              {summarizing ? "Summarizing..." : "Summarize"}
            </button>
          </div>
          {error ? <div style={{ color: T.red, marginTop: 8, fontSize: 13 }}>{error}</div> : null}
          {debugInfo ? (
            <pre
                style={{
                  marginTop: 8,
                  color: T.textSub,
                  fontSize: 12,
                  background: T.surfaceAlt,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: 8,
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {debugInfo}
              </pre>
            ) : null}
          </div>

          <div style={box}>
            <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 10 }}>Status Timeline</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {statuses.map((s, i) => (
                <div
                  key={s}
                  style={{
                    border: `1px solid ${i <= statusIndex ? T.accent : T.border}`,
                    color: i <= statusIndex ? T.accentBright : T.dim,
                    borderRadius: 999,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontFamily: FONTS.mono,
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, color: T.textSub, fontSize: 13 }}>
              Recent Summary: {isSummaryLoading ? "Summarizing transcript..." : (liveRecentSummary || "No summary yet.")}
            </div>
          </div>

          {/* Recent Transcripts Section */}
          {Object.keys(botTranscripts).length > 0 ? (
            <div style={box}>
              <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700, marginBottom: 10 }}>Recent Transcripts</div>
              <div style={{ display: "grid", gap: 8 }}>
                {Object.entries(botTranscripts).slice(0, 5).map(([botId, chunks]) => (
                  <div key={botId} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, background: T.surfaceAlt }}>
                    <div style={{ color: T.textSub, fontSize: 11, marginBottom: 6, fontFamily: FONTS.mono }}>
                      Bot ID: {botId.slice(0, 8)}...
                    </div>
                    <div
                      style={{
                        background: T.surface,
                        borderRadius: 6,
                        maxHeight: 150,
                        overflowY: "auto",
                        padding: 6,
                      }}
                    >
                      {chunks.slice(0, 3).map((chunk, idx) => (
                        <div key={`${botId}_${idx}`} style={{ color: T.textSub, fontSize: 12, lineHeight: 1.3, marginBottom: 3 }}>
                          {chunk.speaker ? <span style={{ color: T.accentBright }}>{chunk.speaker}:</span> : null} {chunk.text}
                        </div>
                      ))}
                      {chunks.length > 3 ? (
                        <div style={{ color: T.dim, fontSize: 11, marginTop: 4, fontStyle: "italic" }}>
                          ... +{chunks.length - 3} more
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div style={{ ...box, display: "grid", gap: 10 }}>
            <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700 }}>Owner Directory</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto auto", gap: 8 }}>
              <input style={inputStyle} placeholder="Name" value={ownerDraft.name} onChange={(e) => setOwnerDraft((p) => ({ ...p, name: e.target.value }))} />
              <input style={inputStyle} placeholder="Email" value={ownerDraft.email} onChange={(e) => setOwnerDraft((p) => ({ ...p, email: e.target.value }))} />
              <input style={inputStyle} placeholder="Notion User ID" value={ownerDraft.notionUserId} onChange={(e) => setOwnerDraft((p) => ({ ...p, notionUserId: e.target.value }))} />
              <label style={{ color: T.textSub, display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={ownerDraft.active} onChange={(e) => setOwnerDraft((p) => ({ ...p, active: e.target.checked }))} />
                Active
              </label>
              <button type="button" onClick={saveOwner} disabled={savingOwner} style={{ ...inputStyle, width: 120, cursor: "pointer" }}>
                {savingOwner ? "Saving..." : "Add Owner"}
              </button>
            </div>
            <div style={{ color: T.textSub, fontSize: 12 }}>
              Owner directory is required only before publish. Add one row per person: exact owner name from tasks, email for reminders, notionUserId (Notion person UUID).
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {owners.map((owner) => (
                <div key={owner.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, color: T.textSub, fontSize: 13 }}>
                  {owner.name} - {owner.email} {owner.notionUserId ? `(${owner.notionUserId})` : ""}
                </div>
              ))}
            </div>
          </div>

          {session?.output?.meetingSummary ? (
            <div style={{ ...box, display: "grid", gap: 10 }}>
              <div style={{ color: T.text, fontFamily: FONTS.sans, fontWeight: 700 }}>Meeting Summary</div>
              <div style={{ color: T.textSub, lineHeight: 1.5 }}>{session.output.meetingSummary || "No summary yet."}</div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

