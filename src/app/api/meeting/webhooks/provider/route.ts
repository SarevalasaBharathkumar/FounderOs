import { NextRequest, NextResponse } from "next/server";
import { extractMeetingOutput, verifyWebhookSignature } from "../../../../../lib/server/meetingOps";
import {
  findSessionByProviderMeetingId,
  getMeetingSession,
  markEventProcessed,
  updateMeetingSession,
} from "../../../../../lib/server/meetingStore";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-meeting-signature");
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: any = {};
  try {
    body = JSON.parse(rawBody || "{}");
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventId = String(body.eventId || body.id || "");
  if (eventId && !markEventProcessed(eventId)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const providerMeetingId = String(body.providerMeetingId || body.bot_id || body.meeting_id || "");
  const sessionId = String(body.sessionId || body.metadata?.sessionId || "");
  const session = (sessionId ? getMeetingSession(sessionId) : null) || (providerMeetingId ? findSessionByProviderMeetingId(providerMeetingId) : null);
  if (!session) return NextResponse.json({ ok: true });

  const eventType = String(body.type || body.event || "").toLowerCase();
  if (eventType.includes("join")) {
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

  if (eventType.includes("end") || eventType.includes("complete")) {
    updateMeetingSession(session.id, (prev) => ({ ...prev, status: "transcript_ready" }));
    const after = getMeetingSession(session.id);
    if (after) {
      const output = await extractMeetingOutput(after);
      updateMeetingSession(session.id, (prev) => ({ ...prev, status: "extracted", output }));
    }
  }

  return NextResponse.json({ ok: true });
}

