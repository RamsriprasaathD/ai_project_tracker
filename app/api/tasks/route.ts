// ramsriprasaath's CODE — /api/tasks/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const { id: userId, role } = decoded as any;

    let tasks;

    if (role === "MANAGER") {
      // Managers can view all tasks
      tasks = await prisma.task.findMany({
        include: { project: true, assignee: true, creator: true },
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "TEAM_LEAD") {
      // TL sees tasks they created or assigned
      tasks = await prisma.task.findMany({
        where: {
          OR: [{ creatorId: userId }, { assignee: { teamLeadId: userId } }],
        },
        include: { project: true, assignee: true },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Team member sees only assigned tasks
      tasks = await prisma.task.findMany({
        where: { assigneeId: userId },
        include: { project: true },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ tasks });
  } catch (err: any) {
    console.error("GET /tasks error:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const { id: userId, role } = decoded as any;


    // Allow MANAGER, TEAM_LEAD, and INDIVIDUAL to create tasks
    if (!role || (role !== "MANAGER" && role !== "TEAM_LEAD" && role !== "INDIVIDUAL")) {
      return NextResponse.json({ 
        error: "Permission denied", 
        details: "Only managers, team leads, and individuals can create tasks",
        userRole: role 
      }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, projectId, assigneeId, dueDate } = body;


    if (!title || !projectId) {
      return NextResponse.json(
        { error: "Title and Project ID are required" },
        { status: 400 }
      );
    }

    // Only allow TLs to assign tasks to their own team members
    if (role === "TEAM_LEAD") {
      if (!assigneeId) {
        return NextResponse.json({ error: "Assignee is required for team lead." }, { status: 400 });
      }
      const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
      if (!assignee || assignee.teamLeadId !== userId) {
        return NextResponse.json({ error: "You can only assign tasks to your own team members." }, { status: 403 });
      }
    }

    // For INDIVIDUAL, only allow creating tasks for their own projects and themselves
    if (role === "INDIVIDUAL") {
      // Check project ownership
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project || project.ownerId !== userId) {
        return NextResponse.json({ error: "You can only create tasks for your own projects." }, { status: 403 });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assigneeId,
        creatorId: userId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        project: true,
        assignee: true,
      },
    });

    return NextResponse.json({ task });
  } catch (err: any) {
    console.error("POST /tasks error:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}

// Edit a task
export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    const { id: userId, role } = decoded as any;
    const { id, ...update } = await req.json();
    if (!id) return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    // Only allow edit if creator or manager
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (role !== "MANAGER" && task.creatorId !== userId) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    const updated = await prisma.task.update({ where: { id }, data: update });
    return NextResponse.json({ task: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Delete a task
export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    const { id: userId, role } = decoded as any;
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (role !== "MANAGER" && task.creatorId !== userId) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
