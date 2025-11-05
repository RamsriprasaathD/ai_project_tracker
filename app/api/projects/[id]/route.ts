import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const { id } = params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: { include: { assignee: true } },
        owner: true,
        organization: true,
      },
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json({ project });
  } catch (err: any) {
    console.error("GET /projects/[id] error:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const { id } = params;
    const { title, description } = await req.json();

    const project = await prisma.project.update({
      where: { id },
      data: { title, description },
    });

    return NextResponse.json({ project });
  } catch (err: any) {
    console.error("PUT /projects/[id] error:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const { id } = params;

    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /projects/[id] error:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}
