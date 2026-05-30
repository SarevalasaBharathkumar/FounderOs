import fs from "node:fs";
import path from "node:path";

export type MeetingTask = {
  id: string;
  title: string;
  ownerName: string;
  ownerEmail?: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  notes?: string;
  sourceSnippet?: string;
  status?: "open" | "done";
};

export type MeetingOutput = {
  meetingSummary: string;
  decisions: string[];
  tasks: MeetingTask[];
};

export type MeetingSession = {
  id: string;
  meetingUrl: string;
  providerMeetingId?: string;
  status: "queued" | "joining" | "recording" | "transcript_ready" | "extracted" | "failed";
  createdAt: string;
  updatedAt: string;
  transcriptChunks: Array<{ ts: string; speaker?: string; text: string }>;
  output?: MeetingOutput;
  published?: boolean;
};

export type OwnerDirectoryRecord = {
  id: string;
  name: string;
  email: string;
  notionUserId: string;
  active: boolean;
};

type TaskSyncRecord = {
  id: string;
  sessionId: string;
  taskId: string;
  notionPageId?: string;
  ownerEmail: string;
  dueDate?: string;
  reminderEnabled: boolean;
  status: "open" | "done";
  reminderCount: number;
  lastReminderAt?: string;
  createdAt: string;
};

type StoreShape = {
  sessions: MeetingSession[];
  owners: OwnerDirectoryRecord[];
  processedEvents: string[];
  taskSync: TaskSyncRecord[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "meeting-ops.json");

const INITIAL: StoreShape = {
  sessions: [],
  owners: [],
  processedEvents: [],
  taskSync: [],
};

function ensureStoreFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, JSON.stringify(INITIAL, null, 2), "utf8");
}

function readStore(): StoreShape {
  ensureStoreFile();
  try {
    const raw = fs.readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return { ...INITIAL, ...parsed };
  } catch {
    return { ...INITIAL };
  }
}

function writeStore(next: StoreShape) {
  ensureStoreFile();
  fs.writeFileSync(STORE_FILE, JSON.stringify(next, null, 2), "utf8");
}

export function createMeetingSession(meetingUrl: string): MeetingSession {
  const store = readStore();
  const id = `ms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const session: MeetingSession = {
    id,
    meetingUrl,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    transcriptChunks: [],
  };
  store.sessions.unshift(session);
  writeStore(store);
  return session;
}

export function listMeetingSessions(limit = 20) {
  const store = readStore();
  return store.sessions.slice(0, limit);
}

export function getMeetingSession(id: string) {
  const store = readStore();
  return store.sessions.find((s) => s.id === id) || null;
}

export function deleteMeetingSession(id: string) {
  const store = readStore();
  const before = store.sessions.length;
  store.sessions = store.sessions.filter((s) => s.id !== id);
  store.taskSync = store.taskSync.filter((r) => r.sessionId !== id);
  writeStore(store);
  return store.sessions.length !== before;
}

export function updateMeetingSession(id: string, updater: (prev: MeetingSession) => MeetingSession) {
  const store = readStore();
  const idx = store.sessions.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const next = updater(store.sessions[idx]);
  next.updatedAt = new Date().toISOString();
  store.sessions[idx] = next;
  writeStore(store);
  return next;
}

export function markEventProcessed(eventId: string) {
  const store = readStore();
  if (store.processedEvents.includes(eventId)) return false;
  store.processedEvents.push(eventId);
  if (store.processedEvents.length > 10000) store.processedEvents = store.processedEvents.slice(-5000);
  writeStore(store);
  return true;
}

export function findSessionByProviderMeetingId(providerMeetingId: string) {
  const store = readStore();
  return store.sessions.find((s) => s.providerMeetingId === providerMeetingId) || null;
}

export function listOwners() {
  return readStore().owners;
}

export function upsertOwner(owner: Omit<OwnerDirectoryRecord, "id"> & { id?: string }) {
  const store = readStore();
  const id = owner.id || `own_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const idx = store.owners.findIndex((o) => o.id === id);
  const record: OwnerDirectoryRecord = { id, ...owner };
  if (idx >= 0) store.owners[idx] = record;
  else store.owners.push(record);
  writeStore(store);
  return record;
}

export function deleteOwner(id: string) {
  const store = readStore();
  store.owners = store.owners.filter((o) => o.id !== id);
  writeStore(store);
}

export function createTaskSyncRecords(records: TaskSyncRecord[]) {
  const store = readStore();
  store.taskSync.push(...records);
  writeStore(store);
}

export function listOpenTaskSync() {
  return readStore().taskSync.filter((r) => r.status === "open");
}

export function updateTaskSync(id: string, updater: (prev: TaskSyncRecord) => TaskSyncRecord) {
  const store = readStore();
  const idx = store.taskSync.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  store.taskSync[idx] = updater(store.taskSync[idx]);
  writeStore(store);
  return store.taskSync[idx];
}

export function cleanupOldMeetingData(days = 30) {
  const store = readStore();
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  const keepIds = new Set<string>();
  store.sessions = store.sessions.filter((s) => {
    const keep = new Date(s.createdAt).getTime() >= threshold;
    if (keep) keepIds.add(s.id);
    return keep;
  });
  store.taskSync = store.taskSync.filter((r) => keepIds.has(r.sessionId));
  writeStore(store);
}
