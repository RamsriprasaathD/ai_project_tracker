// ramsriprasaath's CODE — /api/tasks/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const { id } = params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true, assignee: true, creator: true },
    });

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    return NextResponse.json({ task });
  } catch (err: any) {
    console.error("GET /tasks/[id] error:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const { id } = params;
    const body = await req.json();
    const { title, description, status, assigneeId, dueDate } = body;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        assigneeId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: { project: true, assignee: true },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (err: any) {
    console.error("PUT /tasks/[id] error:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const { id: userId, role } = decoded as any;
    const { id } = params;

    if (role !== "MANAGER" && role !== "TEAM_LEAD") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /tasks/[id] error:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
