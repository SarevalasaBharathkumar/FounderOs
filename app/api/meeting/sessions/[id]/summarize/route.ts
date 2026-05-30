import { NextRequest, NextResponse } from "next/server";
import { extractMeetingOutput } from "../../../../../../src/lib/server/meetingOps";
import { getMeetingSession, updateMeetingSession } from "../../../../../../src/lib/server/meetingStore";

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = getMeetingSession(id);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (!Array.isArray(session.transcriptChunks) || session.transcriptChunks.length === 0) {
    return NextResponse.json({ error: "Transcript is not available yet." }, { status: 400 });
  }

  try {
    const output = await extractMeetingOutput(session);
    const reducedOutput = {
      meetingSummary: output.meetingSummary || "",
      decisions: Array.isArray(output.decisions) ? output.decisions : [],
      tasks: Array.isArray(output.tasks) ? output.tasks : [],
    };
    const updated = updateMeetingSession(id, (prev) => ({
      ...prev,
      status: "extracted",
      output: reducedOutput,
    }));
    return NextResponse.json({ success: true, session: updated || getMeetingSession(id) });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to summarize transcript",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
