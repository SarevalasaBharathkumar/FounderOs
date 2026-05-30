import { NextRequest, NextResponse } from "next/server";
import { getMeetingSession } from "../../../../../lib/server/meetingStore";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = getMeetingSession(id);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json(session);
}

