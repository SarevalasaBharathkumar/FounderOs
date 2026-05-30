import { NextRequest, NextResponse } from "next/server";
import { callMeetingProviderJoin } from "../../../../src/lib/server/meetingOps";
import {
  createMeetingSession,
  listMeetingSessions,
  updateMeetingSession,
} from "../../../../src/lib/server/meetingStore";

function isGoogleMeetLink(url: string) {
  return /^https:\/\/meet\.google\.com\/[a-z-]+/i.test(url);
}

function isPublicHttpUrl(url: string) {
  try {
    const u = new URL(url);
    if (!(u.protocol === "https:" || u.protocol === "http:")) return false;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return false;
    if (host.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const meetingUrl = String(body?.meetingUrl || "").trim();
    if (!meetingUrl || !isGoogleMeetLink(meetingUrl)) {
      return NextResponse.json({ error: "Invalid Google Meet link" }, { status: 400 });
    }

    const recallApiKey = process.env.RECALL_API_KEY || "";
    const recallWebhookUrl = process.env.RECALL_WEBHOOK_URL || process.env.MEETING_PROVIDER_WEBHOOK_URL || "";
    const allowMock = process.env.MEETING_PROVIDER_ALLOW_MOCK === "true";

    if (!recallApiKey && !allowMock) {
      return NextResponse.json(
        {
          error: "RECALL_API_KEY is missing. Set Recall credentials or enable MEETING_PROVIDER_ALLOW_MOCK=true for mock mode.",
        },
        { status: 400 }
      );
    }

    const webhookUrlInvalid = Boolean(recallWebhookUrl) && !isPublicHttpUrl(recallWebhookUrl);
    if (webhookUrlInvalid) {
      return NextResponse.json(
        {
          error:
            "RECALL_WEBHOOK_URL is set but invalid. It must be a public http(s) URL (not localhost/.local).",
        },
        { status: 400 }
      );
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
    } catch (error) {
      updateMeetingSession(session.id, (prev) => ({
        ...prev,
        providerMeetingId,
        status: "failed",
      }));
      return NextResponse.json(
        {
          error: "Failed to join meeting bot",
          details: error instanceof Error ? error.message : "Unknown provider error",
          sessionId: session.id,
        },
        { status: 502 }
      );
    }

    const latest = updateMeetingSession(session.id, (prev) => prev);
    return NextResponse.json({
      sessionId: latest?.id || session.id,
      providerMeetingId,
      status: latest?.status || "joining",
      debug: {
        mockMode: providerMeetingId.startsWith("mock_"),
        webhookUrlConfigured: Boolean(recallWebhookUrl),
        note: providerMeetingId.startsWith("mock_")
          ? "Running in mock mode. No real bot will join until RECALL_API_KEY is set."
          : !recallWebhookUrl
            ? "Bot create succeeded. Configure Recall dashboard status webhooks to receive lifecycle events."
            : undefined,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Unexpected session creation error",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") || "20");
  const sessions = listMeetingSessions(limit);
  return NextResponse.json({ sessions });
}
