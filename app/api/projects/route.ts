import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

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

    if (id) {
      const project = await prisma.project.findUnique({
        where: { id },
        include: { tasks: true, assignedTo: true, owner: true, organization: true },
      });
      return NextResponse.json({ project });
    }

    if (user.role === "MANAGER") {
      const org = await prisma.organization.findFirst({ where: { managerId: user.id } });
      if (!org) return NextResponse.json({ projects: [] });
      const projects = await prisma.project.findMany({
        where: { organizationId: org.id },
        include: { assignedTo: true, owner: true, tasks: true },
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
        include: { tasks: true, assignedTo: true, owner: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ projects });
    }

    if (user.role === "TEAM_MEMBER") {
      const projects = await prisma.project.findMany({
        where: {
          tasks: { some: { assigneeId: user.id } },
        },
        include: { tasks: true, assignedTo: true, owner: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ projects });
    }

    if (user.role === "INDIVIDUAL") {
      const projects = await prisma.project.findMany({
        where: { ownerId: user.id },
        include: { tasks: true, owner: true },
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

    // TEAM_MEMBER and TEAM_LEAD cannot create projects
    if (user.role === "TEAM_MEMBER") {
      return NextResponse.json({ 
        error: "Team members cannot create projects. Only view assigned projects." 
      }, { status: 403 });
    }

    if (user.role === "TEAM_LEAD") {
      return NextResponse.json({ 
        error: "Team leads cannot create projects. Only managers can create projects for team leads." 
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

    return NextResponse.json({ error: "Invalid role" }, { status: 403 });
  } catch (err: any) {
    console.error("❌ /api/projects POST error:", err);
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
