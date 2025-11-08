import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

const db = prisma as any;

export const runtime = "nodejs";

const STORAGE_LIMIT_BYTES = 2 * 1024 * 1024 * 1024; // 2GB per user

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  if (!token) return null;

  const user = await getUserFromToken(token);
  if (!user) return null;

  return user;
}

async function calculateUserUsage(userId: string) {
  const [noteSizes, attachmentSizes] = await Promise.all([
    db.note.findMany({
      where: { userId },
      select: { sizeBytes: true },
    }),
    db.noteAttachment.findMany({
      where: { note: { userId } },
      select: { sizeBytes: true },
    }),
  ]);

  const notesTotal = noteSizes.reduce((sum: number, note: { sizeBytes: number | null }) => sum + (note.sizeBytes ?? 0), 0);
  const attachmentsTotal = attachmentSizes.reduce(
    (sum: number, attachment: { sizeBytes: number }) => sum + attachment.sizeBytes,
    0
  );

  return notesTotal + attachmentsTotal;
}

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [notes, usageBytes] = await Promise.all([
      db.note.findMany({
        where: { userId: user.id },
        include: {
          attachments: {
            select: {
              id: true,
              fileName: true,
              fileType: true,
              sizeBytes: true,
              createdAt: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      calculateUserUsage(user.id),
    ]);

    return NextResponse.json({
      notes,
      usageBytes,
      limitBytes: STORAGE_LIMIT_BYTES,
    });
  } catch (err) {
    console.error("/api/notes GET error:", err);
    return NextResponse.json({ error: "Failed to load notes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const rawTitle = formData.get("title");
    const rawContent = formData.get("content");
    const attachments = formData.getAll("attachments");

    const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
    const content = typeof rawContent === "string" ? rawContent : "";

    const textSize = Buffer.byteLength(content, "utf-8");

    let attachmentsTotal = 0;
    const attachmentPayload = [] as {
      fileName: string;
      fileType: string | null;
      sizeBytes: number;
      data: Buffer;
    }[];

    for (const entry of attachments) {
      if (entry instanceof File) {
        const arrayBuffer = await entry.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        attachmentsTotal += buffer.length;
        attachmentPayload.push({
          fileName: entry.name,
          fileType: entry.type || null,
          sizeBytes: buffer.length,
          data: buffer,
        });
      }
    }

    const currentUsage = await calculateUserUsage(user.id);
    const newUsage = currentUsage + textSize + attachmentsTotal;

    if (newUsage > STORAGE_LIMIT_BYTES) {
      return NextResponse.json(
        {
          error: "Storage limit reached. Please remove existing notes or attachments before adding more.",
          usageBytes: currentUsage,
          limitBytes: STORAGE_LIMIT_BYTES,
        },
        { status: 400 }
      );
    }

    const db = prisma as any;
    const note = await db.note.create({
      data: {
        userId: user.id,
        title: title.length ? title : null,
        content: content.length ? content : null,
        sizeBytes: textSize,
        attachments: attachmentPayload.length
          ? {
              create: attachmentPayload.map((attachment) => ({
                fileName: attachment.fileName,
                fileType: attachment.fileType,
                sizeBytes: attachment.sizeBytes,
                data: attachment.data,
              })),
            }
          : undefined,
      },
      include: {
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
      },
    });

    const usageBytes = await calculateUserUsage(user.id);

    return NextResponse.json({
      note,
      usageBytes,
      limitBytes: STORAGE_LIMIT_BYTES,
    });
  } catch (err) {
    console.error("/api/notes POST error:", err);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
