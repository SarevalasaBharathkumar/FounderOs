import { NextResponse } from "next/server";
import { sendReminderEmail } from "../../../../../src/lib/server/meetingOps";
import { getMeetingSession, listOpenTaskSync, updateTaskSync } from "../../../../../src/lib/server/meetingStore";

function canSendReminder(record: any) {
  if (!record.reminderEnabled) return false;
  const today = new Date();
  const last = record.lastReminderAt ? new Date(record.lastReminderAt) : null;
  if (last && today.toDateString() === last.toDateString()) return false;
  return true;
}

function isPastDuePlusTwo(dueDate?: string) {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const deadline = new Date(due.getTime() + 2 * 24 * 60 * 60 * 1000);
  return Date.now() > deadline.getTime();
}

export async function POST() {
  const open = listOpenTaskSync();
  let sent = 0;
  let skipped = 0;
  const founderEmail = process.env.FOUNDER_EMAIL || "";

  for (const record of open) {
    if (!record.ownerEmail || !canSendReminder(record)) {
      skipped += 1;
      continue;
    }
    if (isPastDuePlusTwo(record.dueDate)) {
      skipped += 1;
      continue;
    }

    const session = getMeetingSession(record.sessionId);
    const task = session?.output?.tasks?.find((t) => t.id === record.taskId);
    if (!task) {
      skipped += 1;
      continue;
    }

    const overdue = Boolean(record.dueDate && new Date(record.dueDate).getTime() < Date.now());
    const result = await sendReminderEmail({
      to: record.ownerEmail,
      ownerName: task.ownerName,
      taskTitle: task.title,
      dueDate: record.dueDate,
      founderEmail,
      overdue,
    });
    if (result.success) {
      updateTaskSync(record.id, (prev) => ({
        ...prev,
        reminderCount: (prev.reminderCount || 0) + 1,
        lastReminderAt: new Date().toISOString(),
      }));
      sent += 1;
    } else {
      skipped += 1;
    }
  }

  return NextResponse.json({ success: true, sent, skipped });
}


