import { NextResponse } from "next/server";
import { cleanupOldMeetingData } from "../../../../lib/server/meetingStore";

export async function POST() {
  cleanupOldMeetingData(30);
  return NextResponse.json({ success: true, retentionDays: 30 });
}

