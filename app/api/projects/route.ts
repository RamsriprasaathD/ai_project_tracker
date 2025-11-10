import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

const VALID_PROJECT_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"] as const;

/**
 * GET /api/projects
 * Returns projects based on user role
 */
export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const user = token ? await getUserFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const summary = url.searchParams.get("summary") === "true";

    const includeOptions = summary ? 
      { assignedTo: true, owner: true, _count: { select: { tasks: true } } } :
      { tasks: true, assignedTo: true, owner: true, organization: true };

    if (id) {
      const project = await prisma.project.findUnique({
        where: { id },
        include: includeOptions,
      });
      return NextResponse.json({ project });
    }

    if (user.role === "MANAGER") {
      const org = await prisma.organization.findFirst({ where: { managerId: user.id } });
      if (!org) return NextResponse.json({ projects: [] });
      const projects = await prisma.project.findMany({
        where: { organizationId: org.id },
        include: includeOptions,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ projects });
    }

    if (user.role === "TEAM_LEAD") {
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { assignedToId: user.id },
            { ownerId: user.id },
          ],
        },
        include: includeOptions,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ projects });
    }

    if (user.role === "TEAM_MEMBER") {
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { assignedToId: user.id },
            { tasks: { some: { assigneeId: user.id } } },
          ],
        },
        include: includeOptions,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ projects });
    }

    if (user.role === "INDIVIDUAL") {
      const projects = await prisma.project.findMany({
        where: { ownerId: user.id },
        include: includeOptions,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ projects });
    }

    return NextResponse.json({ projects: [] });
  } catch (err: any) {
    console.error("❌ /api/projects GET error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/projects
 * Body: { title, description?, assignedToId, deadline? }
 * - MANAGER: Can create projects and assign to TEAM_LEADs
 * - TEAM_LEAD: Can create projects and assign to TEAM_MEMBERs (NOT ALLOWED per requirements)
 * - INDIVIDUAL: Can create projects for themselves
 * - TEAM_MEMBER: CANNOT create projects
 */
export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const user = token ? await getUserFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, description, assignedToId, deadline } = await req.json();
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

    // TEAM_MEMBER cannot create projects
    if (user.role === "TEAM_MEMBER") {
      return NextResponse.json({ 
        error: "Team members cannot create projects. Only view assigned projects." 
      }, { status: 403 });
    }

    let organizationId: string | undefined = undefined;

    // INDIVIDUAL can only create projects for themselves
    if (user.role === "INDIVIDUAL") {
      const project = await prisma.project.create({
        data: {
          title,
          description,
          deadline: deadline ? new Date(deadline) : null,
          ownerId: user.id,
          assignedToId: user.id,
          organizationId: null,
        },
      });
      return NextResponse.json({ success: true, project });
    }

    // MANAGER must specify assigneeId (Team Lead)
    if (user.role === "MANAGER") {
      if (!assignedToId) {
        return NextResponse.json({ 
          error: "Assignee required. Select a Team Lead to assign this project." 
        }, { status: 400 });
      }

      const org = await prisma.organization.findFirst({ where: { managerId: user.id } });
      organizationId = org?.id;

      // Verify assignee is a Team Lead in the manager's organization
      const assignee = await prisma.user.findUnique({ where: { id: assignedToId } });
      if (!assignee || assignee.role !== "TEAM_LEAD" || assignee.organizationId !== org?.id) {
        return NextResponse.json({ 
          error: "Invalid assignee. Managers can only assign projects to Team Leads in their organization." 
        }, { status: 403 });
      }

      const project = await prisma.project.create({
        data: {
          title,
          description,
          deadline: deadline ? new Date(deadline) : null,
          ownerId: user.id,
          assignedToId,
          organizationId,
        },
      });

      return NextResponse.json({ success: true, project });
    }

    if (user.role === "TEAM_LEAD") {
      if (!assignedToId) {
        return NextResponse.json({ 
          error: "Assignee required. Select a team member to assign this project." 
        }, { status: 400 });
      }

      const assignee = await prisma.user.findUnique({ where: { id: assignedToId } });
      if (!assignee || assignee.role !== "TEAM_MEMBER" || assignee.teamLeadId !== user.id) {
        return NextResponse.json({ 
          error: "Invalid assignee. Team Leads can only assign projects to their team members." 
        }, { status: 403 });
      }

      const project = await prisma.project.create({
        data: {
          title,
          description,
          deadline: deadline ? new Date(deadline) : null,
          ownerId: user.id,
          assignedToId,
          organizationId: null,
        },
      });

      return NextResponse.json({ success: true, project });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 403 });
  } catch (err: any) {
    console.error("❌ /api/projects POST error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const user = token ? await getUserFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status } = await req.json();
    if (!id) return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    if (!status || !VALID_PROJECT_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: { assignedToId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.assignedToId || project.assignedToId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { status } as any,
      include: {
        tasks: true,
        assignedTo: true,
        owner: true,
      },
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (err: any) {
    console.error("❌ /api/projects PUT error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/projects?id=...
 */
export async function DELETE(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const user = token ? await getUserFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Project ID required" }, { status: 400 });

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Only the owner or manager can delete
    if (project.ownerId !== user.id && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ /api/projects DELETE error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
