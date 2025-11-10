// app/components/ProjectTable.tsx
"use client";

import React, { useMemo, useState } from "react";
import ProjectInsights from "./ProjectInsights";

type ProjectTableProps = {
  projects?: any[];
  currentUser: any;
  onRefresh?: () => Promise<void>;
};

export default function ProjectTable({ projects = [], currentUser, onRefresh }: ProjectTableProps) {
  const [selectedProject, setSelectedProject] = useState<{ id: string; title: string } | null>(null);

  const statusOptions = [
    { value: "TODO", label: "To Do" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "DONE", label: "Done" },
    { value: "BLOCKED", label: "Blocked" },
  ];

  const statusClasses: Record<string, string> = {
    DONE: "bg-green-500/20 text-green-200 border border-green-400/30",
    IN_PROGRESS: "bg-blue-500/20 text-blue-200 border border-blue-400/30",
    BLOCKED: "bg-red-500/20 text-red-200 border border-red-400/30",
    TODO: "bg-gray-500/20 text-gray-200 border border-gray-400/30",
  };

  const emptyMessage = useMemo(() => {
    if (currentUser?.role === "TEAM_MEMBER") {
      return "No projects assigned to you yet. Your team lead will add you when work is ready.";
    }

    if (currentUser?.role === "TEAM_LEAD") {
      return "No projects assigned to you yet. Your manager will assign projects.";
    }

    return "No projects found. Create your first project!";
  }, [currentUser?.role]);

  async function updateProjectStatus(projectId: string, status: string) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`!,
        },
        body: JSON.stringify({ id: projectId, status }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update project status");
        return;
      }

      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      alert("Error updating project status");
    }
  }

  async function handleDelete(projectId: string) {
    if (!confirm("Delete this project? This will also delete all associated tasks.")) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const res = await fetch(`/api/projects?id=${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`! },
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete project");
        return;
      }
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      alert("Error deleting project");
    }
  }

  if (projects.length === 0) {
    return (
      <div className="bg-gray-900/80 border border-gray-800 p-4 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-blue-400">Projects</h2>
        <p className="text-gray-400 text-center py-8">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 border border-gray-800 p-4 rounded-xl">
      <h2 className="text-xl font-semibold mb-4 text-blue-400">Projects</h2>
      <div className="space-y-3">
        {projects.map((project) => {
          const totalTasks = project.tasks?.length ?? project._count?.tasks ?? 0;
          const completedTasks = project.tasks
            ? project.tasks.filter((task: any) => task.status === "DONE").length
            : project.completedTasks ?? 0;
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : null;

          const canSeeInsights = ["MANAGER", "TEAM_LEAD", "TEAM_MEMBER"].includes(currentUser?.role);
          const canDelete = currentUser?.id === project.ownerId || currentUser?.role === "MANAGER";
          const isAssignedToCurrentUser = project.assignedToId === currentUser?.id;
          const canUpdateProjectStatus = currentUser?.role === "TEAM_MEMBER" && isAssignedToCurrentUser;
          const status = project.status || "TODO";
          const statusLabel = statusOptions.find((option) => option.value === status)?.label || status;
          const statusBadge = (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses[status] || statusClasses["TODO"]}`}
            >
              {statusLabel}
            </span>
          );

          return (
            <div
              key={project.id}
              className="bg-gray-800 p-4 rounded-lg hover:bg-gray-750 transition border border-gray-700 hover:border-blue-500"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-white text-lg mb-1">{project.title}</div>
                  <div className="text-sm text-gray-400 mb-2">{project.description || "No description"}</div>

                  <div className="space-y-1">
                    {project.deadline && (
                      <div className="text-xs text-orange-400">
                        📅 Deadline: {new Date(project.deadline).toLocaleDateString()}
                      </div>
                    )}
                    {project.assignedTo && (
                      <div className="text-xs text-cyan-400">
                        👤 Assigned to: {project.assignedTo.name || project.assignedTo.email}
                      </div>
                    )}
                    {project.owner && currentUser?.role !== "INDIVIDUAL" && (
                      <div className="text-xs text-purple-400">
                        📋 Created by: {project.owner.name || project.owner.email}
                      </div>
                    )}
                    {!canUpdateProjectStatus && (
                      <div className="text-xs text-blue-200 flex items-center gap-1">
                        📊 Status: {statusBadge}
                      </div>
                    )}
                    {totalTasks > 0 && (
                      <div className="text-xs text-green-400">
                        ✓ {totalTasks} task{totalTasks !== 1 ? "s" : ""}
                      </div>
                    )}
                    {progress !== null && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span className="text-gray-200 font-medium">{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs uppercase tracking-wide text-gray-400">Status</span>
                  {canUpdateProjectStatus ? (
                    <select
                      value={status}
                      onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                      className="bg-gray-900 text-gray-100 rounded-md px-3 py-1 text-sm border border-blue-400/40 hover:border-blue-300 transition"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    statusBadge
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                {canSeeInsights && (
                  <button
                    onClick={() => setSelectedProject({ id: project.id, title: project.title })}
                    className="text-purple-400 hover:text-purple-300 text-sm px-3 py-1 rounded border border-purple-400/30 hover:bg-purple-400/10 transition"
                  >
                    AI Insights
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded border border-red-400/30 hover:bg-red-400/10 transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedProject && (
        <ProjectInsights
          projectId={selectedProject.id}
          projectTitle={selectedProject.title}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
