import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const { id: userId, role } = decoded as any;

    let projects;

    // Role-based project fetching
    if (role === "MANAGER") {
      projects = await prisma.project.findMany({
        include: { tasks: true, owner: true },
      });
    } else if (role === "TEAM_LEAD") {
      projects = await prisma.project.findMany({
        where: { ownerId: userId },
        include: { tasks: true },
      });
    } else if (role === "INDIVIDUAL") {
      // INDIVIDUAL: show projects they own
      projects = await prisma.project.findMany({
        where: { ownerId: userId },
        include: { tasks: true },
      });
    } else {
      // TEAM_MEMBER: show projects where assigned a task
      projects = await prisma.project.findMany({
        where: { tasks: { some: { assigneeId: userId } } },
        include: { tasks: true },
      });
    }

    return NextResponse.json({ projects });
  } catch (err: any) {
    console.error("GET /projects error:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Token is missing" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const { id: userId, role, organizationId } = decoded as any;
    const { title, description } = await req.json();

    console.log('User role:', role); // Debug log

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Allow MANAGER, TEAM_LEAD, and INDIVIDUAL to create projects
    if (role !== 'MANAGER' && role !== 'TEAM_LEAD' && role !== 'INDIVIDUAL') {
      console.log('Permission denied for role:', role); // Debug log
      return NextResponse.json({ error: "Permission denied. Only managers, team leads, and individuals can create projects." }, { status: 403 });
    }

    // For INDIVIDUAL, do not set organizationId
    const projectData: any = {
      title,
      description,
      ownerId: userId,
    };
    if (role !== 'INDIVIDUAL') {
      projectData.organizationId = organizationId || undefined;
    }

    const project = await prisma.project.create({
      data: projectData,
      include: {
        tasks: true,
        owner: true
      }
    });

    return NextResponse.json({ project });
  } catch (err: any) {
    console.error("POST /projects error:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}
