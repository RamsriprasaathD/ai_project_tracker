import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

const db = prisma as any;

export const runtime = "nodejs";

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  if (!token) return null;

  return getUserFromToken(token);
}

async function calculateUsage(userId: string) {
  const [noteSizes, attachmentSizes] = await Promise.all([
    db.note.findMany({ where: { userId }, select: { sizeBytes: true } }),
    db.noteAttachment.findMany({ where: { note: { userId } }, select: { sizeBytes: true } }),
  ]);

  const notesTotal = noteSizes.reduce((sum: number, note: { sizeBytes: number | null }) => sum + (note.sizeBytes ?? 0), 0);
  const attachmentsTotal = attachmentSizes.reduce((sum: number, attachment: { sizeBytes: number }) => sum + attachment.sizeBytes, 0);

  return notesTotal + attachmentsTotal;
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    let noteId = resolvedParams?.noteId;
    if (!noteId) {
      const url = new URL(req.url);
      const segments = url.pathname.split("/").filter(Boolean);
      noteId = segments.at(-1) || "";
    }
    if (!noteId || typeof noteId !== "string" || !noteId.trim()) {
      return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
    }

    const note = await db.note.findFirst({
      where: {
        id: noteId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await db.note.delete({ where: { id: noteId } });

    const usageBytes = await calculateUsage(user.id);

    return NextResponse.json({ success: true, usageBytes });
  } catch (err) {
    console.error("/api/notes/[noteId] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
