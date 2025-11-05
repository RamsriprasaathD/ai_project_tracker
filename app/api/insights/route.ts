import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { generateAIInsights } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // 🔐 Verify JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const userId = (decoded as any).id;

    // 🧠 Fetch project with tasks & updates
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: { assignee: true },
        },
        organization: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // 🧩 Prepare structured AI input
    const inputData = {
      projectName: project.title,
      description: project.description || "No description available.",
      tasks:
        project.tasks?.map((t: typeof project.tasks[0]) => ({
          title: t.title,
          status: t.status,
          assignee: t.assignee?.name || null,
        })) || [],
    };

    // 🚀 Call centralized AI helper
    const summary = await generateAIInsights(inputData);

    // 💾 Store AI summary in database
    const insight = await prisma.insight.create({
      data: {
        projectId,
        summary,
        generatedById: userId,
      },
    });

    // ✅ Return response
    return NextResponse.json({
      success: true,
      projectId,
      summary: insight.summary,
    });
  } catch (err: any) {
    console.error("AI Insights Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}
