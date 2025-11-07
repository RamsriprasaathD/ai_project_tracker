import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

/**
 * GET /api/tasks
 */
export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const user = token ? await getUserFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const projectId = url.searchParams.get("projectId");
    const summary = url.searchParams.get("summary") === "true";

    const includeOptions = summary ? 
      { assignee: true, creator: true, project: { select: { id: true, title: true } } } :
      { assignee: true, creator: true, project: true, subtasks: true };

    if (id) {
      const task = await prisma.task.findUnique({
        where: { id },
        include: includeOptions,
      });
      
      // Hide subtasks from everyone except the assigned team member
      if (task && task.subtasks && user.role !== "TEAM_MEMBER") {
        task.subtasks = [];
      } else if (task && task.subtasks && user.role === "TEAM_MEMBER" && task.assigneeId !== user.id) {
        task.subtasks = [];
      }
      
      return NextResponse.json({ task });
    }

    let tasks: any[] = [];

    if (user.role === "MANAGER") {
      const org = await prisma.organization.findFirst({ where: { managerId: user.id } });
      if (org) {
        tasks = await prisma.task.findMany({
          where: {
            parentTaskId: null,
            project: { organizationId: org.id },
          },
          include: includeOptions,
          orderBy: { createdAt: "desc" },
        });
      }
    } else if (user.role === "TEAM_LEAD") {
      tasks = await prisma.task.findMany({
        where: {
          parentTaskId: null,
          OR: [
            { assigneeId: user.id },
            { creatorId: user.id },
            { assignee: { teamLeadId: user.id } },
          ],
          AND: projectId ? [{ projectId }] : undefined,
        },
        include: includeOptions,
        orderBy: { createdAt: "desc" },
      });
    } else if (user.role === "TEAM_MEMBER") {
      tasks = await prisma.task.findMany({
        where: { assigneeId: user.id },
        include: includeOptions,
        orderBy: { createdAt: "desc" },
      });
    } else if (user.role === "INDIVIDUAL") {
      tasks = await prisma.task.findMany({
        where: { OR: [{ assigneeId: user.id }, { creatorId: user.id }] },
        include: includeOptions,
        orderBy: { createdAt: "desc" },
      });
    }
    
    // Note: Subtasks are only visible to team members who are assigned to the task
    // This ensures privacy - team leads and managers cannot see how team members break down their work

    return NextResponse.json({ tasks });
  } catch (err: any) {
    console.error("❌ /api/tasks GET error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/tasks
 * Body: { title, description?, projectId?, assigneeId, dueDate? }
 * - MANAGER: Can create tasks and assign to TEAM_LEADs
 * - TEAM_LEAD: Can create tasks and assign to TEAM_MEMBERs
 * - INDIVIDUAL: Can create tasks for themselves
 * - TEAM_MEMBER: CANNOT create tasks (only subtasks)
 */
export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const user = token ? await getUserFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, description, projectId, assigneeId, dueDate, isPersonal } = await req.json();
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

    const baseData = {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
    };

    // TEAM_MEMBER personal task support
    if (user.role === "TEAM_MEMBER") {
      if (!isPersonal) {
        return NextResponse.json({
          error: "Team members can only create personal tasks.",
        }, { status: 403 });
      }

      const task = await prisma.task.create({
        data: {
          ...baseData,
          projectId: null,
          creatorId: user.id,
          assigneeId: user.id,
          parentTaskId: null,
        },
      });

      return NextResponse.json({ success: true, task });
    }

    // INDIVIDUAL can only create tasks for themselves
    if (user.role === "INDIVIDUAL") {
      const task = await prisma.task.create({
        data: {
          ...baseData,
          projectId: projectId || null,
          assigneeId: user.id,
          creatorId: user.id,
        },
      });
      return NextResponse.json({ success: true, task });
    }

    // TEAM_LEAD personal tasks (self-managed)
    if (user.role === "TEAM_LEAD" && isPersonal) {
      const task = await prisma.task.create({
        data: {
          ...baseData,
          projectId: null,
          creatorId: user.id,
          assigneeId: user.id,
          parentTaskId: null,
        },
      });

      return NextResponse.json({ success: true, task });
    }

    // Remaining cases: MANAGER and TEAM_LEAD creating organizational tasks
    if (!assigneeId) {
      return NextResponse.json({
        error: "Assignee required. Select a team member to assign this task.",
      }, { status: 400 });
    }

    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!assignee) {
      return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
    }

    if (user.role === "MANAGER") {
      const org = await prisma.organization.findFirst({ where: { managerId: user.id } });
      if (!org || assignee.role !== "TEAM_LEAD" || assignee.organizationId !== org.id) {
        return NextResponse.json({
          error: "Managers can only assign tasks to Team Leads in their organization",
        }, { status: 403 });
      }
    }

    if (user.role === "TEAM_LEAD") {
      if (assignee.role !== "TEAM_MEMBER" || assignee.teamLeadId !== user.id) {
        return NextResponse.json({
          error: "Team Leads can only assign tasks to their team members",
        }, { status: 403 });
      }
    }

    const task = await prisma.task.create({
      data: {
        ...baseData,
        projectId: projectId || null,
        assigneeId,
        creatorId: user.id,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    console.error("❌ /api/tasks POST error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

/**
 * PUT /api/tasks
 * Update task status or reassign
 */
export async function PUT(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const user = token ? await getUserFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status, assigneeId } = await req.json();
    if (!id) return NextResponse.json({ error: "Task ID required" }, { status: 400 });

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // Allow status updates for assignee, creator, or TL/Manager
    const canUpdate = 
      task.assigneeId === user.id || 
      task.creatorId === user.id || 
      user.role === "MANAGER" || 
      user.role === "TEAM_LEAD";

    if (!canUpdate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(assigneeId && { assigneeId }),
      },
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (err: any) {
    console.error("❌ /api/tasks PUT error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
