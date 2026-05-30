import { NextRequest, NextResponse } from "next/server";
import { pushTasksToNotion } from "../../../../../../src/lib/server/meetingOps";
import {
  createTaskSyncRecords,
  getMeetingSession,
  listOwners,
  updateMeetingSession,
} from "../../../../../../src/lib/server/meetingStore";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = getMeetingSession(id);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const body = await req.json();
  const reviewedTasks = Array.isArray(body?.tasks) ? body.tasks : session.output?.tasks || [];
  const reviewedDecisions = Array.isArray(body?.decisions) ? body.decisions : session.output?.decisions || [];
  const reminderEnabled = body?.reminderEnabled !== false;
  const owners = listOwners().filter((o) => o.active);

  const unmapped = reviewedTasks.filter((task: any) => {
    const ownerName = String(task?.ownerName || "").trim().toLowerCase();
    if (!ownerName) return true;
    return !owners.some((o) => o.name.toLowerCase() === ownerName);
  });
  if (unmapped.length > 0) {
    return NextResponse.json(
      { error: "Unmapped owners found", unmappedOwners: unmapped.map((t: any) => t.ownerName) },
      { status: 400 }
    );
  }

  const notionResults = await pushTasksToNotion(reviewedTasks, owners, id);
  const now = new Date().toISOString();
  const syncRecords = reviewedTasks.map((task: any, idx: number) => {
    const owner = owners.find((o) => o.name.toLowerCase() === String(task.ownerName || "").toLowerCase());
    const notionRes = notionResults.find((n) => n.taskId === task.id) || notionResults[idx];
    return {
      id: `ts_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      sessionId: id,
      taskId: task.id,
      notionPageId: notionRes?.notionPageId,
      ownerEmail: owner?.email || "",
      dueDate: task?.dueDate || undefined,
      reminderEnabled,
      status: "open" as const,
      reminderCount: 0,
      createdAt: now,
    };
  });
  createTaskSyncRecords(syncRecords);

  updateMeetingSession(id, (prev) => ({
    ...prev,
    published: true,
    output: {
      meetingSummary: prev.output?.meetingSummary || "",
      decisions: reviewedDecisions,
      tasks: reviewedTasks,
    },
  }));

  return NextResponse.json({
    success: true,
    notionResults,
    remindersScheduled: reminderEnabled,
  });
}


