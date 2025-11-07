import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const user = token ? await getUserFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch user's projects and tasks based on role
    let projects: any[] = [];
    let tasks: any[] = [];

    if (user.role === "MANAGER") {
      const org = await prisma.organization.findFirst({ where: { managerId: user.id } });
      if (org) {
        projects = await prisma.project.findMany({
          where: { organizationId: org.id },
          include: { assignedTo: true, tasks: true },
        });
        tasks = await prisma.task.findMany({
          where: { project: { organizationId: org.id } },
          include: { assignee: true, project: true },
        });
      }
    } else if (user.role === "TEAM_LEAD") {
      projects = await prisma.project.findMany({
        where: {
          OR: [
            { assignedToId: user.id },
            { ownerId: user.id },
          ],
        },
        include: { tasks: true, assignedTo: true },
      });
      tasks = await prisma.task.findMany({
        where: {
          OR: [
            { assigneeId: user.id },
            { creatorId: user.id },
            { assignee: { teamLeadId: user.id } },
          ],
        },
        include: { assignee: true, project: true },
      });
    } else if (user.role === "TEAM_MEMBER") {
      tasks = await prisma.task.findMany({
        where: { assigneeId: user.id },
        include: { assignee: true, project: true, subtasks: true },
      });
      projects = await prisma.project.findMany({
        where: {
          tasks: { some: { assigneeId: user.id } },
        },
        include: { tasks: { where: { assigneeId: user.id } } },
      });
    } else if (user.role === "INDIVIDUAL") {
      projects = await prisma.project.findMany({
        where: { ownerId: user.id },
        include: { tasks: true },
      });
      tasks = await prisma.task.findMany({
        where: { OR: [{ assigneeId: user.id }, { creatorId: user.id }] },
        include: { assignee: true, project: true },
      });
    }

    // Calculate statistics
    const stats = {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t: any) => t.status === "DONE").length,
      inProgressTasks: tasks.filter((t: any) => t.status === "IN_PROGRESS").length,
      blockedTasks: tasks.filter((t: any) => t.status === "BLOCKED").length,
      todoTasks: tasks.filter((t: any) => t.status === "TODO").length,
    };

    // Prepare data for AI
    const dashboardData = {
      userRole: user.role,
      userName: user.name || user.email,
      stats,
      projects: projects.map((p: any) => ({
        title: p.title,
        description: p.description,
        deadline: p.deadline,
        tasksCount: p.tasks?.length || 0,
        assignedTo: p.assignedTo?.name || p.assignedTo?.email,
      })),
      tasks: tasks.map((t: any) => ({
        title: t.title,
        status: t.status,
        project: t.project?.title,
        assignee: t.assignee?.name || t.assignee?.email,
        dueDate: t.dueDate,
        subtasksCount: t.subtasks?.length || 0,
      })),
    };

    // Generate AI insights
    const insights = await generateDashboardInsights(dashboardData);

    return NextResponse.json({ insights, stats });
  } catch (err: any) {
    console.error("❌ Dashboard insights error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

async function generateDashboardInsights(data: any): Promise<string> {
  try {
    const { userRole, userName, stats, projects, tasks } = data;

    // Role-specific prompts
    const roleContext = {
      MANAGER: "As a Manager, you oversee the entire organization. Focus on overall progress, team performance, resource allocation, and strategic recommendations.",
      TEAM_LEAD: "As a Team Lead, you manage your team members and coordinate with management. Focus on team task completion, member workload, and bottlenecks.",
      TEAM_MEMBER: "As a Team Member, you execute assigned tasks. Focus on your task progress, upcoming deadlines, and subtask organization.",
      INDIVIDUAL: "As an Individual user, you manage your own projects. Focus on personal productivity, task prioritization, and time management.",
    };

    const prompt = `
You are an AI assistant for a project tracking system. Analyze the user's dashboard and provide actionable insights.

User: ${userName}
Role: ${userRole}
Context: ${roleContext[userRole as keyof typeof roleContext]}

Dashboard Statistics:
• Total Projects: ${stats.totalProjects}
• Total Tasks: ${stats.totalTasks}
• Completed: ${stats.completedTasks}
• In Progress: ${stats.inProgressTasks}
• Blocked: ${stats.blockedTasks}
• To Do: ${stats.todoTasks}

Projects (${projects.length}):
${projects.length > 0 ? projects.slice(0, 5).map((p: any) => 
  `• ${p.title}${p.assignedTo ? ` (Assigned to: ${p.assignedTo})` : ""} - ${p.tasksCount} tasks`
).join("\n") : "No projects"}

Tasks (${tasks.length}):
${tasks.length > 0 ? tasks.slice(0, 10).map((t: any) => 
  `• ${t.title} - ${t.status}${t.project ? ` [${t.project}]` : ""}${t.assignee ? ` (${t.assignee})` : ""}`
).join("\n") : "No tasks"}

Provide insights in EXACTLY this format with bullet points (NO emojis or icons):

**Dashboard Overview:**
• [Key observation about overall status]
• [Completion rate insight]
• [Workload assessment]

**What's Going Well:**
• [Positive highlight 1]
• [Positive highlight 2]

**Areas Needing Attention:**
• [Issue or blocker 1]
• [Issue or blocker 2]

**Recommendations:**
• [Actionable recommendation 1]
• [Actionable recommendation 2]
• [Actionable recommendation 3]

Keep each bullet point concise (1-2 lines). Be specific and actionable based on the role.
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
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "You are a project management AI assistant. Always provide structured insights with clear sections and bullet points. Be concise, specific, and actionable.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const dataRes = await response.json();

    if (!response.ok || !dataRes?.choices?.length) {
      console.error("AI API Error:", dataRes);
      return generateFallbackInsights(data);
    }

    const summary = dataRes.choices[0].message?.content?.trim();
    return summary || generateFallbackInsights(data);
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return generateFallbackInsights(data);
  }
}

function generateFallbackInsights(data: any): string {
  const { userRole, stats } = data;
  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  return `
**Dashboard Overview:**
• You have ${stats.totalProjects} active project${stats.totalProjects !== 1 ? 's' : ''} with ${stats.totalTasks} total task${stats.totalTasks !== 1 ? 's' : ''}
• Current completion rate: ${completionRate}% (${stats.completedTasks}/${stats.totalTasks} tasks done)
• ${stats.inProgressTasks} task${stats.inProgressTasks !== 1 ? 's are' : ' is'} currently in progress

**What's Going Well:**
• ${stats.completedTasks > 0 ? `${stats.completedTasks} task${stats.completedTasks !== 1 ? 's' : ''} successfully completed` : 'No completed tasks yet - great opportunity to start!'}
• ${stats.blockedTasks === 0 ? 'No blocked tasks - workflow is smooth' : `${stats.blockedTasks} task${stats.blockedTasks !== 1 ? 's need' : ' needs'} attention`}

**Areas Needing Attention:**
${stats.blockedTasks > 0 ? `• ${stats.blockedTasks} blocked task${stats.blockedTasks !== 1 ? 's require' : ' requires'} immediate resolution` : '• All systems running smoothly'}
${stats.todoTasks > 0 ? `• ${stats.todoTasks} task${stats.todoTasks !== 1 ? 's are' : ' is'} waiting to be started` : '• No pending tasks in queue'}

**Recommendations:**
${userRole === 'MANAGER' ? '• Review blocked tasks and allocate resources to unblock them\n• Monitor team progress and provide support where needed\n• Consider workload distribution across team leads' : ''}
${userRole === 'TEAM_LEAD' ? '• Check in with team members on in-progress tasks\n• Address any blockers preventing task completion\n• Plan task assignments for optimal team productivity' : ''}
${userRole === 'TEAM_MEMBER' ? '• Break down complex tasks into sub-tasks for better tracking\n• Update task status regularly to keep team informed\n• Reach out to team lead if any tasks are blocked' : ''}
${userRole === 'INDIVIDUAL' ? '• Prioritize tasks based on deadlines and importance\n• Start working on TODO tasks to maintain momentum\n• Review completed tasks for lessons learned' : ''}
• Focus on moving ${stats.inProgressTasks > 0 ? 'in-progress tasks' : 'TODO tasks'} to completion
`;
}
