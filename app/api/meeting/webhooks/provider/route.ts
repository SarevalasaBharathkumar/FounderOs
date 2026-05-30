import { NextRequest, NextResponse } from "next/server";
import {
  createRecallAsyncTranscript,
  downloadRecallTranscript,
  extractMeetingOutput,
  getRecallTranscriptArtifact,
  getRecallBotTranscript,
  verifyRecallSvixSignature,
  verifyWebhookSignature,
} from "../../../../../src/lib/server/meetingOps";
import {
  findSessionByProviderMeetingId,
  getMeetingSession,
  markEventProcessed,
  updateMeetingSession,
} from "../../../../../src/lib/server/meetingStore";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-meeting-signature");
  const svixValid = verifyRecallSvixSignature(rawBody, {
    webhookId: req.headers.get("webhook-id"),
    webhookTimestamp: req.headers.get("webhook-timestamp"),
    webhookSignature: req.headers.get("webhook-signature"),
  });
  const legacyValid = verifyWebhookSignature(rawBody, signature);
  if (!svixValid && !legacyValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: any = {};
  try {
    body = JSON.parse(rawBody || "{}");
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventId = String(body.eventId || body.id || body.event_id || "");
  if (eventId && !markEventProcessed(eventId)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const providerMeetingId = String(body.providerMeetingId || body.bot_id || body.meeting_id || body?.data?.bot_id || "");
  const sessionId = String(body.sessionId || body.metadata?.sessionId || "");
  const session =
    (sessionId ? getMeetingSession(sessionId) : null) ||
    (providerMeetingId ? findSessionByProviderMeetingId(providerMeetingId) : null);
  if (!session) return NextResponse.json({ ok: true });

  const rawEvent = String(body.event || body.type || "").toLowerCase();
  if (rawEvent === "recording.done") {
    const recordingId = String(body?.data?.recording?.id || body?.data?.id || "");
    if (recordingId) {
      await createRecallAsyncTranscript(recordingId);
      updateMeetingSession(session.id, (prev) => ({ ...prev, status: "transcript_ready" }));
    }
    return NextResponse.json({ ok: true });
  }

  if (rawEvent === "transcript.done") {
    const transcriptId = String(body?.data?.transcript?.id || body?.data?.id || "");
    if (transcriptId) {
      const transcriptArtifact = await getRecallTranscriptArtifact(transcriptId);
      const downloadUrl = String(transcriptArtifact?.data?.download_url || "");
      const rows = downloadUrl ? await downloadRecallTranscript(downloadUrl) : [];
      if (rows.length > 0) {
        updateMeetingSession(session.id, (prev) => ({
          ...prev,
          status: "transcript_ready",
          transcriptChunks: rows,
        }));
      } else if (session.providerMeetingId) {
        const fallbackRows = await getRecallBotTranscript(session.providerMeetingId);
        if (fallbackRows.length > 0) {
          updateMeetingSession(session.id, (prev) => ({
            ...prev,
            status: "transcript_ready",
            transcriptChunks: fallbackRows,
          }));
        }
      }
    }
    return NextResponse.json({ ok: true });
  }

  const eventType = String(body.type || body.event || body?.data?.status?.code || "").toLowerCase();
  const statusCode = String(body?.data?.status?.code || "").toLowerCase();

  if (eventType.includes("join") || statusCode === "joining_call") {
    updateMeetingSession(session.id, (prev) => ({ ...prev, status: "recording" }));
  }

  if (eventType.includes("transcript") || body.transcriptChunk || body.text) {
    updateMeetingSession(session.id, (prev) => ({
      ...prev,
      status: "recording",
      transcriptChunks: [
        ...prev.transcriptChunks,
        {
          ts: String(body.timestamp || new Date().toISOString()),
          speaker: body.speaker ? String(body.speaker) : undefined,
          text: String(body.transcriptChunk || body.text || ""),
        },
      ],
    }));
  }

  if (statusCode === "fatal" || eventType.includes("fatal")) {
    updateMeetingSession(session.id, (prev) => ({ ...prev, status: "failed" }));
    return NextResponse.json({ ok: true });
  }

  const isEnded = statusCode === "call_ended" || eventType.includes("end");
  const isDone =
    statusCode === "done" ||
    statusCode === "analysis_done" ||
    eventType.includes("complete") ||
    eventType.includes("done");

  if (isEnded || isDone) {
    updateMeetingSession(session.id, (prev) => ({ ...prev, status: "transcript_ready" }));
  }

  if (isDone) {
    if (session.providerMeetingId) {
      const transcriptRows = await getRecallBotTranscript(session.providerMeetingId);
      if (transcriptRows.length > 0) {
        updateMeetingSession(session.id, (prev) => ({
          ...prev,
          transcriptChunks: transcriptRows,
        }));
      }
    }

    const after = getMeetingSession(session.id);
    if (after) {
      const output = await extractMeetingOutput(after);
      updateMeetingSession(session.id, (prev) => ({ ...prev, status: "extracted", output }));
    }
  }

  return NextResponse.json({ ok: true });
}
