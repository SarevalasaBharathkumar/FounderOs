import { MeetingOutput, MeetingSession, MeetingTask, OwnerDirectoryRecord } from "./meetingStore";
import crypto from "node:crypto";

function getOpenAiKey() {
  return process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_KEY || "";
}

function getOpenRouterKey() {
  return (
    process.env.OPENROUTER_API_KEY ||
    process.env.NEXT_PUBLIC_OPENROUTER_KEY ||
    process.env.REACT_APP_OPENROUTER_KEY ||
    ""
  );
}

export async function callMeetingProviderJoin(meetingUrl: string, sessionId: string) {
  const region = process.env.RECALL_REGION || "us-east-1";
  const baseUrl = process.env.RECALL_API_URL || `https://${region}.recall.ai/api/v1`;
  const apiKey = process.env.RECALL_API_KEY || process.env.MEETING_PROVIDER_API_KEY || "";
  if (!baseUrl || !apiKey) {
    return { providerMeetingId: `mock_${sessionId}`, status: "joining" as const };
  }

  const webhookUrl = process.env.RECALL_WEBHOOK_URL || process.env.MEETING_PROVIDER_WEBHOOK_URL || "";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/bot/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${apiKey}`,
    },
    body: JSON.stringify({
      meeting_url: meetingUrl,
      bot_name: "FounderOS COO Bot",
      recording_config: {
        transcript: {
          provider: {
            recallai_streaming: {
              mode: "prioritize_low_latency",
              language_code: "en",
            },
          },
        },
      },
      metadata: { sessionId },
      webhook_url: webhookUrl || undefined,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Provider join failed: ${response.status} ${text}`);
  }
  const payload = await response.json();
  return {
    providerMeetingId: payload.id || payload.bot_id || `ext_${sessionId}`,
    status: "joining" as const,
  };
}

export function verifyWebhookSignature(rawBody: string, incomingSignature: string | null) {
  const secret = process.env.RECALL_WEBHOOK_SECRET || process.env.MEETING_PROVIDER_WEBHOOK_SECRET || "";
  if (!secret) return true;
  if (!incomingSignature) return false;
  const expected = Buffer.from(`${secret}:${rawBody}`).toString("base64");
  if (incomingSignature === expected) return true;
  return false;
}

export function verifyRecallSvixSignature(rawBody: string, headers: { webhookId?: string | null; webhookTimestamp?: string | null; webhookSignature?: string | null }) {
  const secret = process.env.RECALL_WEBHOOK_SECRET || "";
  const webhookId = headers.webhookId || "";
  const webhookTimestamp = headers.webhookTimestamp || "";
  const webhookSignature = headers.webhookSignature || "";
  if (!secret) return true;
  if (!webhookId || !webhookTimestamp || !webhookSignature) return false;

  const normalizedSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let secretBytes: Buffer;
  try {
    secretBytes = Buffer.from(normalizedSecret, "base64");
  } catch {
    return false;
  }

  const signedPayload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const digest = crypto.createHmac("sha256", secretBytes).update(signedPayload).digest("base64");
  const signatures = webhookSignature.split(" ").flatMap((chunk) => chunk.split(",")).map((s) => s.trim());
  return signatures.some((sig) => sig === `v1,${digest}` || sig === digest || sig.endsWith(digest));
}

export async function getRecallBotTranscript(providerMeetingId: string) {
  const region = process.env.RECALL_REGION || "us-east-1";
  const baseUrl = process.env.RECALL_API_URL || `https://${region}.recall.ai/api/v1`;
  const apiKey = process.env.RECALL_API_KEY || process.env.MEETING_PROVIDER_API_KEY || "";
  
  if (!baseUrl || !apiKey || !providerMeetingId) {
    console.warn("[getRecallBotTranscript] Missing config:", { hasBaseUrl: !!baseUrl, hasApiKey: !!apiKey, hasProviderMeetingId: !!providerMeetingId });
    return [];
  }

  const toRows = (payload: any) => {
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.transcript)
        ? payload.transcript
        : Array.isArray(payload?.paragraphs)
          ? payload.paragraphs
          : [];
    if (!Array.isArray(rows) || rows.length === 0) return [];
    return rows.map((entry: any) => {
      // Extract text from multiple possible formats
      let text = "";
      let ts = new Date().toISOString();
      
      if (typeof entry?.text === "string" && entry.text.trim()) {
        text = entry.text.trim();
      } else if (typeof entry?.sentence === "string" && entry.sentence.trim()) {
        text = entry.sentence.trim();
      } else if (typeof entry?.content === "string" && entry.content.trim()) {
        text = entry.content.trim();
      } else if (Array.isArray(entry?.words) && entry.words.length > 0) {
        // Handle Recall API format: array of word objects with "text" property
        text = entry.words
          .map((w: any) => String(w?.text || "").trim())
          .filter((t: string) => t.length > 0)
          .join(" ")
          .trim();
        
        // Use timestamp from first word if available (Recall API format)
        if (entry.words[0]?.start_timestamp?.absolute) {
          ts = entry.words[0].start_timestamp.absolute;
        }
      }
      
      // Extract speaker from multiple possible formats
      const speaker = entry?.speaker
        ? String(entry.speaker)
        : entry?.participant?.name
          ? String(entry.participant.name)
          : entry?.speaker_name
            ? String(entry.speaker_name)
            : undefined;
      
      return { ts, speaker, text };
    }).filter((row: any) => row.text && row.text.length > 0);
  };

  // Try direct path first: /bot/{botId}/transcript/
  try {
    const directUrl = `${baseUrl.replace(/\/$/, "")}/bot/${providerMeetingId}/transcript/`;
    console.log("[getRecallBotTranscript] Trying direct path:", directUrl);
    const response = await fetch(directUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Token ${apiKey}`,
      },
    });
    
    if (response.ok) {
      const payload = await response.json();
      const directRows = toRows(payload);
      console.log("[getRecallBotTranscript] Direct path success:", { count: directRows.length });
      if (directRows.length > 0) return directRows;
    } else {
      console.log("[getRecallBotTranscript] Direct path failed:", { status: response.status });
    }
  } catch (err) {
    console.error("[getRecallBotTranscript] Direct path error:", err);
  }

  // Fallback path: /recording/?bot_id={botId} -> get transcript artifact ID -> /transcript/{id}
  try {
    const recordingsUrl = `${baseUrl.replace(/\/$/, "")}/recording/?bot_id=${encodeURIComponent(providerMeetingId)}&limit=1`;
    console.log("[getRecallBotTranscript] Trying fallback path (recordings):", recordingsUrl);
    const recordingsRes = await fetch(recordingsUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Token ${apiKey}`,
      },
    });
    
    if (!recordingsRes.ok) {
      console.warn("[getRecallBotTranscript] Fallback recordings fetch failed:", { status: recordingsRes.status });
      return [];
    }
    
    const recordingsPayload = await recordingsRes.json();
    console.log("[getRecallBotTranscript] Recordings payload received:", { hasResults: !!recordingsPayload?.results });
    
    const recordings = Array.isArray(recordingsPayload?.results)
      ? recordingsPayload.results
      : Array.isArray(recordingsPayload)
        ? recordingsPayload
        : [];
    
    console.log("[getRecallBotTranscript] Recordings found:", { count: recordings.length });
    
    // Get the download URL from media_shortcuts (official path from Recall.ai docs)
    const downloadUrl = recordings?.[0]?.media_shortcuts?.transcript?.data?.download_url;
    
    if (!downloadUrl) {
      console.warn("[getRecallBotTranscript] No transcript download URL found in media_shortcuts");
      return [];
    }

    console.log("[getRecallBotTranscript] Fetching transcript from download URL:", downloadUrl);
    
    const transcriptRes = await fetch(downloadUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });
    
    if (!transcriptRes.ok) {
      console.warn("[getRecallBotTranscript] Transcript download failed:", { status: transcriptRes.status });
      return [];
    }
    
    const transcriptPayload = await transcriptRes.json();
    const artifactRows = toRows(transcriptPayload);
    console.log("[getRecallBotTranscript] Fallback path success:", { count: artifactRows.length });
    return artifactRows;
  } catch (err) {
    console.error("[getRecallBotTranscript] Fallback path error:", err);
    return [];
  }
}

export async function getRecallBotStatus(providerMeetingId: string) {
  const region = process.env.RECALL_REGION || "us-east-1";
  const baseUrl = process.env.RECALL_API_URL || `https://${region}.recall.ai/api/v1`;
  const apiKey = process.env.RECALL_API_KEY || process.env.MEETING_PROVIDER_API_KEY || "";
  if (!baseUrl || !apiKey || !providerMeetingId) return null;

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/bot/${providerMeetingId}/`, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Token ${apiKey}`,
    },
  });
  if (!response.ok) return null;
  const payload = await response.json();
  const directStatus = String(payload?.status || "").toLowerCase();
  const directSubCode = String(payload?.status_sub_code || "").toLowerCase();
  const changes = Array.isArray(payload?.status_changes) ? payload.status_changes : [];
  const lastCode = changes.length > 0 ? String(changes[changes.length - 1]?.code || "").toLowerCase() : "";
  const lastSubCode = changes.length > 0 ? String(changes[changes.length - 1]?.sub_code || "").toLowerCase() : "";
  const code = lastCode || directStatus;
  const subCode = lastSubCode || directSubCode;
  return { code, subCode, payload };
}

export async function createRecallAsyncTranscript(recordingId: string) {
  const region = process.env.RECALL_REGION || "us-east-1";
  const baseUrl = process.env.RECALL_API_URL || `https://${region}.recall.ai/api/v1`;
  const apiKey = process.env.RECALL_API_KEY || process.env.MEETING_PROVIDER_API_KEY || "";
  if (!baseUrl || !apiKey || !recordingId) return null;

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/recording/${recordingId}/create_transcript/`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Token ${apiKey}`,
    },
    body: JSON.stringify({
      provider: {
        recallai_async: {
          language_code: "auto",
        },
      },
      diarization: {
        use_separate_streams_when_available: true,
      },
    }),
  });
  if (!response.ok) return null;
  const payload = await response.json();
  return {
    transcriptId: String(payload?.id || ""),
    downloadUrl: payload?.data?.download_url ? String(payload.data.download_url) : null,
  };
}

export async function getRecallTranscriptArtifact(transcriptId: string) {
  const region = process.env.RECALL_REGION || "us-east-1";
  const baseUrl = process.env.RECALL_API_URL || `https://${region}.recall.ai/api/v1`;
  const apiKey = process.env.RECALL_API_KEY || process.env.MEETING_PROVIDER_API_KEY || "";
  if (!baseUrl || !apiKey || !transcriptId) return null;

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/transcript/${transcriptId}/`, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Token ${apiKey}`,
    },
  });
  if (!response.ok) return null;
  return response.json();
}

export async function downloadRecallTranscript(downloadUrl: string) {
  if (!downloadUrl) return [];
  const response = await fetch(downloadUrl, { method: "GET", headers: { accept: "application/json" } });
  if (!response.ok) return [];
  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload : [];
  return rows
    .map((entry: any) => ({
      ts: new Date().toISOString(),
      speaker: entry?.participant?.name ? String(entry.participant.name) : entry?.speaker ? String(entry.speaker) : undefined,
      text:
        (typeof entry?.text === "string" && entry.text.trim()) ||
        (typeof entry?.sentence === "string" && entry.sentence.trim()) ||
        (typeof entry?.content === "string" && entry.content.trim()) ||
        (Array.isArray(entry?.words) ? entry.words.map((w: any) => String(w?.text || "")).join(" ").trim() : ""),
    }))
    .filter((row: any) => row.text);
}

function fallbackExtract(transcript: string): MeetingOutput {
  const lines = transcript.split("\n").map((l) => l.trim()).filter(Boolean);
  const decisions = lines.filter((l) => /decide|decision|agreed/i.test(l)).slice(0, 8);
  const taskCandidates = lines.filter((l) => /action|todo|owner|next step|will/i.test(l)).slice(0, 12);
  const tasks: MeetingTask[] = taskCandidates.map((line, idx) => ({
    id: `task_${idx + 1}`,
    title: line.slice(0, 140),
    ownerName: "Unassigned",
    priority: "medium",
    notes: "",
    sourceSnippet: line.slice(0, 280),
    status: "open",
  }));
  return {
    meetingSummary: lines.slice(0, 5).join(" ").slice(0, 500) || "Meeting completed. Review transcript for details.",
    decisions,
    tasks,
  };
}

export async function extractMeetingOutput(session: MeetingSession): Promise<MeetingOutput> {
  const transcriptText = session.transcriptChunks.map((c) => `${c.speaker ? `${c.speaker}: ` : ""}${c.text}`).join("\n");
  const openRouterKey = getOpenRouterKey();
  const openAiKey = getOpenAiKey();
  if (!openRouterKey && !openAiKey) {
    return fallbackExtract(transcriptText);
  }

  const schemaPrompt = `You are an executive meeting analyst.
Return only strict JSON object with keys:
{
  "meetingSummary": string,
  "decisions": string[],
  "tasks": [{
    "title": string,
    "ownerName": string,
    "dueDate": string,
    "priority": "low"|"medium"|"high",
    "notes": string,
    "sourceSnippet": string
  }]
}
No markdown.`;

  const useOpenRouter = Boolean(openRouterKey);
  const apiUrl = useOpenRouter ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
  const authKey = useOpenRouter ? openRouterKey : openAiKey;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authKey}`,
      ...(useOpenRouter ? { "HTTP-Referer": "https://founderos.local", "X-Title": "FounderOS Meeting Ops" } : {}),
    },
    body: JSON.stringify({
      model: useOpenRouter ? "openai/gpt-oss-120b:free" : "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: schemaPrompt },
        { role: "user", content: `Meeting transcript:\n${transcriptText}` },
      ],
    }),
  });
  if (!response.ok) return fallbackExtract(transcriptText);
  const payload = await response.json();
  const raw = payload?.choices?.[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(String(raw).replace(/```json|```/g, "").trim());
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    return {
      meetingSummary: String(parsed.meetingSummary || ""),
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions.map(String) : [],
      tasks: tasks.map((t: any, idx: number) => ({
        id: `task_${idx + 1}`,
        title: String(t.title || ""),
        ownerName: String(t.ownerName || "Unassigned"),
        dueDate: t.dueDate ? String(t.dueDate) : undefined,
        priority: t.priority === "low" || t.priority === "high" ? t.priority : "medium",
        notes: t.notes ? String(t.notes) : "",
        sourceSnippet: t.sourceSnippet ? String(t.sourceSnippet) : "",
        status: "open",
      })),
    };
  } catch {
    return fallbackExtract(transcriptText);
  }
}

export async function pushTasksToNotion(
  tasks: MeetingTask[],
  owners: OwnerDirectoryRecord[],
  sessionId: string
) {
  const token = process.env.NOTION_API_KEY || "";
  const databaseId = process.env.NOTION_TASKS_DATABASE_ID || "";
  if (!token || !databaseId) {
    return tasks.map((task) => ({
      taskId: task.id,
      notionPageId: `mock_notion_${sessionId}_${task.id}`,
      success: true,
      mock: true,
    }));
  }

  const results: Array<{ taskId: string; notionPageId?: string; success: boolean; error?: string }> = [];
  for (const task of tasks) {
    const owner = owners.find((o) => o.name.toLowerCase() === task.ownerName.toLowerCase() && o.active);
    try {
      const response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties: {
            Name: { title: [{ text: { content: task.title } }] },
            Status: { select: { name: "Open" } },
            Priority: { select: { name: task.priority || "medium" } },
            "Due Date": task.dueDate ? { date: { start: task.dueDate } } : undefined,
            Owner: owner?.notionUserId ? { people: [{ id: owner.notionUserId }] } : undefined,
            "Session ID": { rich_text: [{ text: { content: sessionId } }] },
          },
          children: task.notes ? [{ object: "block", paragraph: { rich_text: [{ type: "text", text: { content: task.notes } }] } }] : [],
        }),
      });
      if (!response.ok) {
        results.push({ taskId: task.id, success: false, error: await response.text() });
      } else {
        const payload = await response.json();
        results.push({ taskId: task.id, notionPageId: payload.id, success: true });
      }
    } catch (error: any) {
      results.push({ taskId: task.id, success: false, error: error?.message || "Unknown error" });
    }
  }
  return results;
}

export async function sendReminderEmail({
  to,
  ownerName,
  taskTitle,
  dueDate,
  founderEmail,
  overdue,
}: {
  to: string;
  ownerName: string;
  taskTitle: string;
  dueDate?: string;
  founderEmail?: string;
  overdue?: boolean;
}) {
  const apiKey = process.env.RESEND_API_KEY || "";
  const from = process.env.RESEND_FROM_EMAIL || "coo-agent@updates.local";
  if (!apiKey) return { success: true, mock: true };

  const subject = overdue ? `Overdue task follow-up: ${taskTitle}` : `Task reminder: ${taskTitle}`;
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;line-height:1.6">
    <p>Hi ${ownerName || "there"},</p>
    <p>This is your AI COO reminder for task:</p>
    <p><strong>${taskTitle}</strong></p>
    ${dueDate ? `<p>Due date: <strong>${dueDate}</strong></p>` : ""}
    <p>Please update completion status.</p>
  </div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      cc: overdue && founderEmail ? [founderEmail] : undefined,
      subject,
      html,
    }),
  });
  if (!response.ok) return { success: false, error: await response.text() };
  return { success: true };
}
