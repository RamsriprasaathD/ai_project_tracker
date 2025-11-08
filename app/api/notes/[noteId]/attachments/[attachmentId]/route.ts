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

export async function GET(
  req: Request,
  context: {
    params: { noteId: string; attachmentId: string } | Promise<{ noteId: string; attachmentId: string }>;
  }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noteId, attachmentId } = await context.params;

    const attachment = await db.noteAttachment.findFirst({
      where: {
        id: attachmentId,
        noteId,
        note: { userId: user.id },
      },
      select: {
        fileName: true,
        fileType: true,
        data: true,
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const headers = new Headers();
    const fileName = attachment.fileName || "download";
    const encodedFileName = encodeURIComponent(fileName);

    headers.set("Content-Type", attachment.fileType || "application/octet-stream");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${fileName.replace(/"/g, '\"')}"; filename*=UTF-8''${encodedFileName}`
    );

    return new Response(attachment.data, { headers });
  } catch (err) {
    console.error("/api/notes/[noteId]/attachments/[attachmentId] GET error:", err);
    return NextResponse.json({ error: "Failed to download attachment" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: {
    params: { noteId: string; attachmentId: string } | Promise<{ noteId: string; attachmentId: string }>;
  }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noteId, attachmentId } = await context.params;

    const attachment = await db.noteAttachment.findFirst({
      where: {
        id: attachmentId,
        noteId,
        note: { userId: user.id },
      },
      select: { id: true },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    await db.noteAttachment.delete({ where: { id: attachmentId } });

    const usageBytes = await calculateUsage(user.id);

    return NextResponse.json({ success: true, usageBytes });
  } catch (err) {
    console.error("/api/notes/[noteId]/attachments/[attachmentId] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
  }
}
