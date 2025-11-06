import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const user = token ? await getUserFromToken(token) : null;

    if (!user || user.role !== "MANAGER") {
      return NextResponse.json(
        { error: "Unauthorized - Only managers can view team lead insights" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const teamLeadId = searchParams.get("teamLeadId");

    if (!teamLeadId) {
      return NextResponse.json({ error: "Team Lead ID required" }, { status: 400 });
    }

    // Verify the team lead belongs to manager's organization
    const org = await prisma.organization.findFirst({ where: { managerId: user.id } });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const teamLead = await prisma.user.findUnique({ where: { id: teamLeadId } });
    if (!teamLead || teamLead.organizationId !== org.id || teamLead.role !== "TEAM_LEAD") {
      return NextResponse.json({ error: "Team Lead not found in your organization" }, { status: 404 });
    }

    // Fetch all projects assigned to or owned by this team lead
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { assignedToId: teamLeadId },
          { ownerId: teamLeadId },
        ],
      },
      include: {
        tasks: {
          include: {
            assignee: true,
          },
        },
      },
    });

    // Fetch all tasks for this team lead
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: teamLeadId },
          { creatorId: teamLeadId },
        ],
      },
    });

    // Calculate statistics
    const totalProjects = projects.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === "DONE").length;
    const inProgressTasks = tasks.filter((t: any) => t.status === "IN_PROGRESS").length;
    const blockedTasks = tasks.filter((t: any) => t.status === "BLOCKED").length;
    const todoTasks = tasks.filter((t: any) => t.status === "TODO").length;
    const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Separate manager-assigned vs own projects
    const managerAssignedProjects = projects.filter(
      (p: any) => p.assignedToId === teamLeadId && p.ownerId !== teamLeadId
    );
    const ownProjects = projects.filter((p: any) => p.ownerId === teamLeadId);

    // Calculate project-wise completion
    const projectCompletions = projects.map((p: any) => {
      const projectTasks = p.tasks.length;
      const projectCompleted = p.tasks.filter((t: any) => t.status === "DONE").length;
      const projectCompletion = projectTasks > 0 ? Math.round((projectCompleted / projectTasks) * 100) : 0;
      return {
        title: p.title,
        completion: projectCompletion,
        totalTasks: projectTasks,
        completedTasks: projectCompleted,
      };
    });

    // Prepare data for AI
    const insightData = {
      teamLeadName: teamLead.name || teamLead.email,
      totalProjects,
      managerAssignedProjects: managerAssignedProjects.length,
      ownProjects: ownProjects.length,
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      todoTasks,
      overallCompletion,
      projectCompletions,
    };

    // Generate AI insights
    const insights = await generateTeamLeadInsights(insightData);

    return NextResponse.json({
      insights,
      stats: {
        totalProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        todoTasks,
        overallCompletion,
      },
      projects: projects.map((p: any) => ({ id: p.id, title: p.title })),
    });
  } catch (err: any) {
    console.error("Error generating team lead insights:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

async function generateTeamLeadInsights(data: any): Promise<string> {
  try {
    const prompt = `You are an AI project management analyst. Analyze this Team Lead's performance and provide insights.

Team Lead: ${data.teamLeadName}

Overall Statistics:
- Total Projects: ${data.totalProjects} (${data.managerAssignedProjects} assigned by manager, ${data.ownProjects} self-created)
- Total Tasks: ${data.totalTasks}
- Completed Tasks: ${data.completedTasks}
- In Progress: ${data.inProgressTasks}
- Blocked: ${data.blockedTasks}
- To Do: ${data.todoTasks}
- Overall Completion Rate: ${data.overallCompletion}%

Project-wise Breakdown:
${data.projectCompletions.map((p: any) => `- ${p.title}: ${p.completion}% (${p.completedTasks}/${p.totalTasks} tasks)`).join('\n')}

Provide structured insights in the following format (NO emojis or icons):

**Performance Overview:**
• Overall assessment of the Team Lead's performance
• Completion rate analysis
• Workload evaluation

**Project Management:**
• How they're handling manager-assigned projects
• Performance on self-created projects
• Project completion trends

**Task Analysis:**
• Task completion efficiency
• Identification of bottlenecks (blocked tasks)
• In-progress task management

**Recommendations:**
• Immediate actions for improvement
• Workload management suggestions
• Support or resources needed
• Recognition for good performance

Keep insights concise, actionable, and data-driven. Format as bullet points.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a project management AI that provides clear, actionable insights without using emojis or icons.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error("AI API request failed");
    }

    const aiData = await response.json();
    return aiData.choices[0]?.message?.content || generateFallbackTeamLeadInsights(data);
  } catch (error) {
    console.error("AI generation error:", error);
    return generateFallbackTeamLeadInsights(data);
  }
}

function generateFallbackTeamLeadInsights(data: any): string {
  return `**Performance Overview:**
• ${data.teamLeadName} is managing ${data.totalProjects} projects with ${data.totalTasks} total tasks
• Overall completion rate: ${data.overallCompletion}%
• Currently has ${data.inProgressTasks} tasks in progress and ${data.blockedTasks} blocked tasks

**Project Management:**
• Managing ${data.managerAssignedProjects} manager-assigned projects
• Created ${data.ownProjects} personal projects
• ${data.overallCompletion >= 70 ? "Strong" : data.overallCompletion >= 50 ? "Moderate" : "Needs improvement in"} project completion rate

**Task Analysis:**
• Completed: ${data.completedTasks} tasks
• In Progress: ${data.inProgressTasks} tasks
• Blocked: ${data.blockedTasks} tasks requiring attention
• To Do: ${data.todoTasks} tasks pending

**Recommendations:**
• ${data.blockedTasks > 0 ? `Address ${data.blockedTasks} blocked tasks to unblock progress` : "No blocked tasks - good workflow management"}
• ${data.overallCompletion < 50 ? "Consider providing additional support or resources" : "Continue current pace"}
• ${data.totalProjects > 5 ? "Heavy workload - consider redistributing some projects" : "Workload appears manageable"}
• Regular check-ins recommended to maintain progress`;
}
