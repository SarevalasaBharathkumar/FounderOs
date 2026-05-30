import { NextRequest, NextResponse } from "next/server";
import { deleteOwner, listOwners, upsertOwner } from "../../../../lib/server/meetingStore";

export async function GET() {
  return NextResponse.json({ owners: listOwners() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim();
  const notionUserId = String(body?.notionUserId || "").trim();
  const active = body?.active !== false;
  if (!name || !email) return NextResponse.json({ error: "name and email required" }, { status: 400 });
  const owner = upsertOwner({ id: body?.id, name, email, notionUserId, active });
  return NextResponse.json({ owner });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deleteOwner(id);
  return NextResponse.json({ success: true });
}

