import { NextRequest, NextResponse } from "next/server";
import { getRecallBotStatus, getRecallBotTranscript } from "../../../../../src/lib/server/meetingOps";

export async function GET(_req: NextRequest, context: { params: Promise<{ botId: string }> }) {
  const { botId } = await context.params;
  if (!botId) return NextResponse.json({ error: "botId is required" }, { status: 400 });

  try {
    const [status, transcript] = await Promise.all([
      getRecallBotStatus(botId),
      getRecallBotTranscript(botId),
    ]);
    return NextResponse.json({
      botId,
      providerState: status
        ? {
            code: status.code || null,
            subCode: status.subCode || null,
          }
        : null,
      transcriptChunks: transcript || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch transcript from provider bot ID",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

