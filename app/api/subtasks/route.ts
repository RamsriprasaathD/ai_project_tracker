import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

/**
 * GET /api/subtasks?parentId=taskId
 */
export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const user = token ? await getUserFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const parentId = url.searchParams.get("parentId");
    if (!parentId) return NextResponse.json({ error: "Missing parentId" }, { status: 400 });

    const subtasks = await prisma.task.findMany({
      where: { parentTaskId: parentId },
      include: { assignee: true, creator: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subtasks });
  } catch (err: any) {
    console.error("❌ /api/subtasks GET error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/subtasks
 * Body: { title, description?, parentTaskId, status? }
 * - TEAM_MEMBER only (must own parent task)
 */
export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const user = token ? await getUserFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, description, parentTaskId, status } = await req.json();
    if (!title || !parentTaskId)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    if (user.role !== "TEAM_MEMBER") {
      return NextResponse.json({ error: "Only team members can create subtasks" }, { status: 403 });
    }

    const parentTask = await prisma.task.findUnique({
      where: { id: parentTaskId },
    });

    if (!parentTask || parentTask.assigneeId !== user.id) {
      return NextResponse.json({ error: "Not authorized for this task" }, { status: 403 });
    }

    const subtask = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        parentTaskId,
        creatorId: user.id,
        assigneeId: user.id,
      },
    });

    return NextResponse.json({ success: true, subtask });
  } catch (err: any) {
    console.error("❌ /api/subtasks POST error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

/**
 * PUT /api/subtasks
 * Body: { id, status }
 * - TEAM_MEMBER can update only their own subtasks
 */
export async function PUT(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const user = token ? await getUserFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status } = await req.json();
    if (!id || !status)
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });

    const subtask = await prisma.task.findUnique({ where: { id } });
    if (!subtask || subtask.assigneeId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, subtask: updated });
  } catch (err: any) {
    console.error("❌ /api/subtasks PUT error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/subtasks?id=...
 * - Only the member who created the subtask can delete it
 */
export async function DELETE(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const user = token ? await getUserFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const subtask = await prisma.task.findUnique({ where: { id } });
    if (!subtask || subtask.assigneeId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ /api/subtasks DELETE error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
