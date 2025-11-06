import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const user = token ? await getUserFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Fetch the project with all related data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: true,
        assignedTo: true,
        tasks: {
          include: {
            assignee: true,
            subtasks: true,
          },
        },
        organization: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check permissions - only owner (manager) or assigned TL can view insights
    if (user.role === "MANAGER") {
      // Manager can only see insights for projects in their organization
      const org = await prisma.organization.findFirst({ where: { managerId: user.id } });
      if (!org || project.organizationId !== org.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (user.role === "TEAM_LEAD") {
      // Team Lead can only see insights for their assigned projects
      if (project.assignedToId !== user.id && project.ownerId !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Unauthorized - Only managers and team leads can view project insights" }, { status: 403 });
    }

    // Calculate project statistics
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t: any) => t.status === "DONE").length;
    const inProgressTasks = project.tasks.filter((t: any) => t.status === "IN_PROGRESS").length;
    const blockedTasks = project.tasks.filter((t: any) => t.status === "BLOCKED").length;
    const todoTasks = project.tasks.filter((t: any) => t.status === "TODO").length;
    
    const completionPercentage = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    // Get Team Lead's other workload (if project is assigned to a TL)
    let teamLeadWorkload = null;
    if (project.assignedToId) {
      const tlProjects = await prisma.project.findMany({
        where: { assignedToId: project.assignedToId },
        include: { tasks: true },
      });

      const tlTasks = await prisma.task.findMany({
        where: {
          OR: [
            { assigneeId: project.assignedToId },
            { creatorId: project.assignedToId },
          ],
        },
      });

      teamLeadWorkload = {
        totalProjects: tlProjects.length,
        totalTasks: tlTasks.length,
        completedTasks: tlTasks.filter((t: any) => t.status === "DONE").length,
        inProgressTasks: tlTasks.filter((t: any) => t.status === "IN_PROGRESS").length,
      };
    }

    // Prepare data for AI
    const insightData = {
      projectTitle: project.title,
      projectDescription: project.description,
      assignedTo: project.assignedTo?.name || project.assignedTo?.email,
      assignedToRole: project.assignedTo?.role,
      createdBy: project.owner?.name || project.owner?.email,
      viewerRole: user.role,
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        todoTasks,
        completionPercentage,
      },
      tasks: project.tasks.map((t: any) => ({
        title: t.title,
        status: t.status,
        assignee: t.assignee?.name || t.assignee?.email,
        dueDate: t.dueDate,
        subtasksCount: t.subtasks?.length || 0,
      })),
      teamLeadWorkload,
    };

    // Generate AI insights
    const insights = await generateProjectInsights(insightData);

    return NextResponse.json({ 
      insights, 
      stats: insightData.stats,
      project: {
        title: project.title,
        assignedTo: project.assignedTo?.name || project.assignedTo?.email,
      }
    });
  } catch (err: any) {
    console.error("❌ Project insights error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

async function generateProjectInsights(data: any): Promise<string> {
  try {
    const { projectTitle, assignedTo, assignedToRole, viewerRole, stats, tasks, teamLeadWorkload } = data;

    const prompt = `
You are an AI assistant for a project tracking system. Analyze this specific project and provide detailed insights.

Project: ${projectTitle}
${assignedTo ? `Assigned To: ${assignedTo} (${assignedToRole})` : "Not assigned"}
Viewed By: ${viewerRole}

Project Statistics:
• Total Tasks: ${stats.totalTasks}
• Completed: ${stats.completedTasks} (${stats.completionPercentage}%)
• In Progress: ${stats.inProgressTasks}
• Blocked: ${stats.blockedTasks}
• To Do: ${stats.todoTasks}

Tasks Breakdown:
${tasks.length > 0 ? tasks.map((t: any) => 
  `• ${t.title} - ${t.status}${t.assignee ? ` (Assigned to: ${t.assignee})` : " (Unassigned)"}${t.subtasksCount > 0 ? ` [${t.subtasksCount} subtasks]` : ""}`
).join("\n") : "No tasks"}

${teamLeadWorkload ? `
Team Lead Overall Workload:
• Total Projects: ${teamLeadWorkload.totalProjects}
• Total Tasks Across All Projects: ${teamLeadWorkload.totalTasks}
• Completed: ${teamLeadWorkload.completedTasks}
• In Progress: ${teamLeadWorkload.inProgressTasks}
` : ""}

Provide insights in EXACTLY this format (NO emojis or icons):

**Project Completion Status:**
• Current completion percentage and analysis
• Progress assessment based on task status
• Timeline evaluation

**Team Lead Performance:**
${assignedTo ? "• How the assigned Team Lead is managing this project\n• Their overall workload impact on this project\n• Task distribution and delegation effectiveness" : "• Project is not yet assigned to a Team Lead\n• Recommendation to assign for progress"}

**Task Analysis:**
• Breakdown of task statuses
• Identification of bottlenecks or blockers
• Unassigned tasks requiring attention

**Recommendations:**
• Immediate actions needed
• Resource allocation suggestions
• Timeline or priority adjustments
• Follow-up items for manager

Keep each bullet point concise (1-2 lines). Be specific with numbers and task names.
Do not use any emojis, icons, or special characters in your response.
`;

    // Call GROQ API
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
            content: "You are a project management AI assistant specializing in project analysis. Provide structured, data-driven insights without emojis. Be specific and actionable.",
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

    const dataRes = await response.json();

    if (!response.ok || !dataRes?.choices?.length) {
      console.error("AI API Error:", dataRes);
      return generateFallbackProjectInsights(data);
    }

    const summary = dataRes.choices[0].message?.content?.trim();
    return summary || generateFallbackProjectInsights(data);
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return generateFallbackProjectInsights(data);
  }
}

function generateFallbackProjectInsights(data: any): string {
  const { projectTitle, assignedTo, stats, tasks, teamLeadWorkload } = data;

  const unassignedTasks = tasks.filter((t: any) => !t.assignee);
  const blockedTasksList = tasks.filter((t: any) => t.status === "BLOCKED");

  return `
**Project Completion Status:**
• Project "${projectTitle}" is ${stats.completionPercentage}% complete (${stats.completedTasks}/${stats.totalTasks} tasks done)
• ${stats.inProgressTasks} task${stats.inProgressTasks !== 1 ? 's are' : ' is'} currently being worked on
• ${stats.todoTasks} task${stats.todoTasks !== 1 ? 's remain' : ' remains'} to be started

**Team Lead Performance:**
${assignedTo ? `• Assigned to ${assignedTo} who is managing ${teamLeadWorkload?.totalProjects || 0} total projects
• This Team Lead has ${teamLeadWorkload?.totalTasks || 0} total tasks across all projects
• Their completion rate is ${teamLeadWorkload ? Math.round((teamLeadWorkload.completedTasks / teamLeadWorkload.totalTasks) * 100) : 0}%` : 
`• Project is not yet assigned to a Team Lead
• Immediate assignment recommended to begin progress`}

**Task Analysis:**
• Completed: ${stats.completedTasks} tasks finished successfully
• In Progress: ${stats.inProgressTasks} tasks actively being worked on
• Blocked: ${stats.blockedTasks} task${stats.blockedTasks !== 1 ? 's are' : ' is'} blocked${blockedTasksList.length > 0 ? ` (${blockedTasksList[0].title}${blockedTasksList.length > 1 ? ' and others' : ''})` : ''}
• Unassigned: ${unassignedTasks.length} task${unassignedTasks.length !== 1 ? 's need' : ' needs'} assignment

**Recommendations:**
${stats.blockedTasks > 0 ? `• Urgently address ${stats.blockedTasks} blocked task${stats.blockedTasks !== 1 ? 's' : ''} to unblock progress` : '• No blockers - workflow is running smoothly'}
${unassignedTasks.length > 0 ? `• Assign ${unassignedTasks.length} unassigned task${unassignedTasks.length !== 1 ? 's' : ''} to team members` : '• All tasks are properly assigned'}
${stats.completionPercentage < 50 ? '• Project is less than 50% complete - may need additional resources or priority' : ''}
${stats.completionPercentage >= 50 && stats.completionPercentage < 100 ? '• Project is making good progress - maintain momentum' : ''}
${stats.completionPercentage === 100 ? '• Project is complete - ready for review and closure' : ''}
${teamLeadWorkload && teamLeadWorkload.totalProjects > 3 ? `• Team Lead is managing ${teamLeadWorkload.totalProjects} projects - consider workload redistribution` : ''}
`;
}
