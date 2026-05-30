import { NextRequest, NextResponse } from "next/server";
import { callMeetingProviderJoin } from "../../../../lib/server/meetingOps";
import {
  createMeetingSession,
  listMeetingSessions,
  updateMeetingSession,
} from "../../../../lib/server/meetingStore";

function isGoogleMeetLink(url: string) {
  return /^https:\/\/meet\.google\.com\/[a-z-]+/i.test(url);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const meetingUrl = String(body?.meetingUrl || "").trim();
    if (!meetingUrl || !isGoogleMeetLink(meetingUrl)) {
      return NextResponse.json({ error: "Invalid Google Meet link" }, { status: 400 });
    }

    const session = createMeetingSession(meetingUrl);
    let providerMeetingId = `mock_${session.id}`;
    try {
      const provider = await callMeetingProviderJoin(meetingUrl, session.id);
      providerMeetingId = provider.providerMeetingId;
      updateMeetingSession(session.id, (prev) => ({
        ...prev,
        providerMeetingId,
        status: "joining",
      }));
    } catch {
      updateMeetingSession(session.id, (prev) => ({
        ...prev,
        providerMeetingId,
        status: "failed",
      }));
      return NextResponse.json({ error: "Failed to join meeting bot", sessionId: session.id }, { status: 502 });
    }

    const latest = updateMeetingSession(session.id, (prev) => prev);
    return NextResponse.json({
      sessionId: latest?.id || session.id,
      providerMeetingId,
      status: latest?.status || "joining",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") || "20");
  const sessions = listMeetingSessions(limit);
  return NextResponse.json({ sessions });
}

