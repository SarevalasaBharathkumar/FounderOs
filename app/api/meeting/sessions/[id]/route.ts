import { NextRequest, NextResponse } from "next/server";
import {
  extractMeetingOutput,
  getRecallBotStatus,
  getRecallBotTranscript,
} from "../../../../../src/lib/server/meetingOps";
import { deleteMeetingSession, getMeetingSession, updateMeetingSession } from "../../../../../src/lib/server/meetingStore";

function mapRecallCodeToSessionStatus(code: string) {
  const normalized = String(code || "").toLowerCase();
  if (normalized === "in_call_recording") return "recording" as const;
  if (normalized === "call_ended") return "transcript_ready" as const;
  if (normalized === "done" || normalized === "analysis_done" || normalized === "recording_done") return "transcript_ready" as const;
  if (normalized === "fatal") return "failed" as const;
  return "joining" as const;
}

function reasonFromRecallSubCode(subCode: string) {
  const s = String(subCode || "").toLowerCase();
  if (!s) return "";
  if (s === "timeout_exceeded_waiting_room") {
    return "Bot was not admitted from waiting room before timeout. No transcript was produced.";
  }
  return `Recall status sub-code: ${s}`;
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    let session = getMeetingSession(id);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    if (session.providerMeetingId && !session.providerMeetingId.startsWith("mock_")) {
      const providerMeetingId = session.providerMeetingId;
      const live = await getRecallBotStatus(providerMeetingId);
      if (session.transcriptChunks.length === 0) {
        const transcriptRows = await getRecallBotTranscript(providerMeetingId);
        if (transcriptRows.length > 0) {
          session = updateMeetingSession(id, (prev) => ({ ...prev, transcriptChunks: transcriptRows })) || session;
        }
      }
      if (live?.code) {
        const nextStatus = mapRecallCodeToSessionStatus(live.code);
        if (nextStatus !== session.status) {
          session = updateMeetingSession(id, (prev) => ({ ...prev, status: nextStatus })) || session;
        }
      }
      const liveCode = live?.code || null;
      const liveSubCode = live?.subCode || null;
      const transcriptReason = session.transcriptChunks.length > 0 ? "" : reasonFromRecallSubCode(liveSubCode || "");
      return NextResponse.json({
        ...session,
        providerState: {
          code: liveCode,
          subCode: liveSubCode,
          transcriptReason: transcriptReason || null,
        },
      });
    }

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch meeting session",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const deleted = deleteMeetingSession(id);
  if (!deleted) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
