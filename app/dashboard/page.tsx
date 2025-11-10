"use client";

import { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ProjectTable from "../components/ProjectTable";
import TaskTable from "../components/TaskTable";
import TeamLeadInsights from "../components/TeamLeadInsights";

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]); // For TL: Projects assigned by manager
  const [ownProjects, setOwnProjects] = useState<any[]>([]); // For TL: Projects created by TL
  const [tasks, setTasks] = useState<any[]>([]);
  const [teamLeads, setTeamLeads] = useState<any[]>([]); // For Manager: Team leads in organization
  const [selectedTeamLead, setSelectedTeamLead] = useState<any>(null); // For TL insights modal
  const [stats, setStats] = useState({ totalProjects: 0, totalTasks: 0, completedTasks: 0, inProgressTasks: 0 });
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return null;
      }

      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("userRole", data.user.role);
        return data.user;
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
    return null;
  }, [router]);

  const partitionProjectsForTeamLead = useCallback((projectsList: any[], user: any) => {
    if (!user || user.role !== "TEAM_LEAD") return;

    const assigned = projectsList.filter((p: any) => p.assignedToId === user.id && p.ownerId !== user.id);
    const own = projectsList.filter((p: any) => p.ownerId === user.id);
    setAssignedProjects(assigned);
    setOwnProjects(own);
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [] as any[];

      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch projects");
      }

      const allProjects = data.projects || [];
      setProjects(allProjects);

      return allProjects;
    } catch (err) {
      console.error("Error fetching projects:", err);
      return [] as any[];
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [] as any[];

      const res = await fetch("/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch tasks");
      }

      const fetchedTasks = data.tasks || [];
      setTasks(fetchedTasks);
      return fetchedTasks;
    } catch (err) {
      console.error("Error fetching tasks:", err);
      return [] as any[];
    }
  }, []);

  const fetchTeamLeads = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/assignable-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        const tls = (data.users || []).filter((u: any) => u.role === "TEAM_LEAD");
        setTeamLeads(tls);
      }
    } catch (err) {
      console.error("Error fetching team leads:", err);
    }
  }, []);

  const calculateStats = useCallback((projectsList: any[], tasksList: any[]) => {
    const completed = tasksList.filter((t: any) => t.status === "DONE").length;
    const inProgress = tasksList.filter((t: any) => t.status === "IN_PROGRESS").length;

    setStats({
      totalProjects: projectsList.length,
      totalTasks: tasksList.length,
      completedTasks: completed,
      inProgressTasks: inProgress,
    });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const user = await fetchCurrentUser();
    const [projectsList, tasksList] = await Promise.all([
      fetchProjects(),
      fetchTasks(),
    ]);

    if (user?.role === "MANAGER") {
      await fetchTeamLeads();
    }

    calculateStats(projectsList, tasksList);
    setLoading(false);
  }, [calculateStats, fetchCurrentUser, fetchProjects, fetchTasks, fetchTeamLeads]);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchProjects(), fetchTasks()]);
  }, [fetchProjects, fetchTasks]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate stats whenever projects or tasks change
  useEffect(() => {
    if (projects.length >= 0 || tasks.length >= 0) {
      calculateStats(projects, tasks);
    }
  }, [calculateStats, projects, tasks]);

  useEffect(() => {
    if (currentUser?.role === "TEAM_LEAD") {
      partitionProjectsForTeamLead(projects, currentUser);
    }
  }, [currentUser, partitionProjectsForTeamLead, projects]);


  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600 text-xl animate-pulse">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Dashboard
                </h1>
                <p className="text-gray-700">
                  Welcome back, {currentUser?.name || currentUser?.email}! 
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                    {currentUser?.role?.replace("_", " ")}
                  </span>
                  {currentUser?.role === "TEAM_LEAD" && currentUser?.tlIdWithinOrg && (
                    <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm font-medium">
                      ID: TL-{currentUser.tlIdWithinOrg}
                    </span>
                  )}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Projects</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProjects}</p>
                    </div>
                    <div className="text-4xl">📁</div>
                  </div>
                </div>

                <div className="bg-white border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Total Tasks</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTasks}</p>
                    </div>
                    <div className="text-4xl">✓</div>
                  </div>
                </div>

                <div className="bg-white border border-amber-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-600 text-sm font-medium">In Progress</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.inProgressTasks}</p>
                    </div>
                    <div className="text-4xl">⚡</div>
                  </div>
                </div>

                <div className="bg-white border border-emerald-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-600 text-sm font-medium">Completed</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedTasks}</p>
                    </div>
                    <div className="text-4xl">🎉</div>
                  </div>
                </div>
              </div>

              {/* Role-specific message */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-8 transition-colors duration-200">
                <p className="text-gray-700 text-sm">
                  {currentUser?.role === "MANAGER" && "You can create projects and assign them to your Team Leads."}
                  {currentUser?.role === "TEAM_LEAD" && "You can create projects and tasks for your team members."}
                  {currentUser?.role === "TEAM_MEMBER" && "You can view your assigned projects and update task statuses so your team lead sees progress."}
                  {currentUser?.role === "INDIVIDUAL" && "You have full control over your personal projects and tasks."}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {(currentUser?.role === "MANAGER" || currentUser?.role === "INDIVIDUAL" || currentUser?.role === "TEAM_LEAD") && (
                  <button
                    onClick={() => router.push("/projects")}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-xl text-left transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <div className="text-2xl mb-2">➕</div>
                    <div className="font-semibold text-lg">Create New Project</div>
                    <div className="text-sm text-blue-50">Start organizing your work</div>
                  </button>
                )}
                
                {currentUser?.role !== "TEAM_MEMBER" && (
                  <button
                    onClick={() => router.push("/tasks")}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 rounded-xl text-left transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <div className="text-2xl mb-2">✓</div>
                    <div className="font-semibold text-lg">Create New Task</div>
                    <div className="text-sm text-green-50 mt-1">Add a task to track</div>
                  </button>
                )}
              </div>

              {/* Team Lead Insights Boxes (Manager Only) */}
              {currentUser?.role === "MANAGER" && teamLeads.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Team Lead Performance
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamLeads.map((tl) => (
                      <button
                        key={tl.id}
                        onClick={() => setSelectedTeamLead({ id: tl.id, name: tl.name || tl.email })}
                        className="bg-white border border-indigo-200 hover:border-indigo-400 rounded-xl p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{tl.name || tl.email}</h3>
                          <span className="text-2xl">📊</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {tl.tlIdWithinOrg ? `TL-${tl.tlIdWithinOrg}` : "Team Lead"}
                        </div>
                        <div className="text-xs text-indigo-600 font-medium">
                          Click to view detailed insights
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Projects & Tasks */}
              {currentUser?.role === "TEAM_LEAD" ? (
                // Team Lead View: Separate sections
                <>
                  {/* Manager Assigned Projects */}
                  {assignedProjects.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-2xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
                        Projects Assigned by Manager
                        <span className="text-sm text-gray-500 font-normal">({assignedProjects.length})</span>
                      </h2>
                      <ProjectTable 
                        projects={assignedProjects} 
                        currentUser={currentUser} 
                        onRefresh={refreshData}
                      />
                    </div>
                  )}

                  {/* Own Projects */}
                  {ownProjects.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-2xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
                        My Projects
                        <span className="text-sm text-gray-500 font-normal">({ownProjects.length})</span>
                      </h2>
                      <ProjectTable 
                        projects={ownProjects} 
                        currentUser={currentUser} 
                        onRefresh={refreshData}
                      />
                    </div>
                  )}

                  {/* Recent Tasks */}
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">Recent Tasks</h2>
                    <TaskTable 
                      tasks={tasks.slice(0, 10)} 
                      currentUser={currentUser} 
                      onRefresh={refreshData}
                    />
                  </div>
                </>
              ) : currentUser?.role === "TEAM_MEMBER" ? (
                // Team Member View: Projects from TL + assigned tasks
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-emerald-50 border border-indigo-200 rounded-xl p-4 transition-colors duration-200">
                    <p className="text-sm text-gray-700">
                      Projects your Team Lead assigns appear below with a live progress bar. Update your task statuses to keep the project bar in sync for your TL.
                    </p>
                  </div>

                  <ProjectTable
                    projects={projects}
                    currentUser={currentUser}
                    onRefresh={refreshData}
                  />

                  <div>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">My Assigned Tasks</h2>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4 transition-colors duration-200">
                      <p className="text-sm text-gray-700">
                        Only you can change these task statuses. Every update instantly reflects back to your Team Lead.
                      </p>
                    </div>
                    <TaskTable 
                      tasks={tasks} 
                      currentUser={currentUser} 
                      onRefresh={refreshData}
                    />
                  </div>
                </div>
              ) : (
                // Manager/Individual View: Standard layout
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ProjectTable 
                    projects={projects.slice(0, 5)} 
                    currentUser={currentUser} 
                    onRefresh={refreshData}
                  />
                  
                  <TaskTable 
                    tasks={tasks.slice(0, 5)} 
                    currentUser={currentUser} 
                    onRefresh={refreshData}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Team Lead Insights Modal */}
      {selectedTeamLead && (
        <TeamLeadInsights
          teamLeadId={selectedTeamLead.id}
          teamLeadName={selectedTeamLead.name}
          onClose={() => setSelectedTeamLead(null)}
        />
      )}
    </div>
  );
}
