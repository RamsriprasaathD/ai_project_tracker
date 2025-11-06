// app/components/ProjectTable.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProjectInsights from "./ProjectInsights";

export default function ProjectTable({ projects = [], currentUser, onRefresh }: { projects?: any[], currentUser: any, onRefresh?: () => Promise<void> }) {
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState<{ id: string; title: string } | null>(null);

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
      if (onRefresh) await onRefresh();
    } catch (err) {
      alert("Error deleting project");
    }
  }

  if (projects.length === 0) {
    return (
      <div className="bg-gray-900/80 border border-gray-800 p-4 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-blue-400">Projects</h2>
        <p className="text-gray-400 text-center py-8">
          {currentUser?.role === "TEAM_MEMBER" 
            ? "No projects with assigned tasks yet."
            : currentUser?.role === "TEAM_LEAD"
            ? "No projects assigned to you yet. Your manager will assign projects."
            : "No projects found. Create your first project!"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 border border-gray-800 p-4 rounded-xl">
      <h2 className="text-xl font-semibold mb-4 text-blue-400">Projects</h2>
      <div className="space-y-3">
        {projects.map((p) => (
          <div key={p.id} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-750 transition border border-gray-700 hover:border-blue-500">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-semibold text-white text-lg mb-1">{p.title}</div>
                <div className="text-sm text-gray-400 mb-2">{p.description || "No description"}</div>
                
                <div className="space-y-1">
                  {p.deadline && (
                    <div className="text-xs text-orange-400">
                      📅 Deadline: {new Date(p.deadline).toLocaleDateString()}
                    </div>
                  )}
                  {p.assignedTo && (
                    <div className="text-xs text-cyan-400">
                      👤 Assigned to: {p.assignedTo.name || p.assignedTo.email}
                    </div>
                  )}
                  {p.owner && currentUser?.role !== "INDIVIDUAL" && (
                    <div className="text-xs text-purple-400">
                      📋 Created by: {p.owner.name || p.owner.email}
                    </div>
                  )}
                  {p.tasks && p.tasks.length > 0 && (
                    <div className="text-xs text-green-400">
                      ✓ {p.tasks.length} task{p.tasks.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                {/* View Details button for managers and team leads */}
                {(currentUser?.role === "MANAGER" || currentUser?.role === "TEAM_LEAD") && (
                  <button 
                    onClick={() => router.push(`/project/${p.id}`)} 
                    className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 rounded border border-blue-400/30 hover:bg-blue-400/10 transition"
                  >
                    Manage Tasks
                  </button>
                )}
                
                {/* Insights button for managers and team leads */}
                {(currentUser?.role === "MANAGER" || currentUser?.role === "TEAM_LEAD") && (
                  <button 
                    onClick={() => setSelectedProject({ id: p.id, title: p.title })} 
                    className="text-purple-400 hover:text-purple-300 text-sm px-3 py-1 rounded border border-purple-400/30 hover:bg-purple-400/10 transition"
                  >
                    AI Insights
                  </button>
                )}
                
                {/* Only allow delete for creator or manager */}
                {(currentUser?.id === p.ownerId || currentUser?.role === "MANAGER") && (
                  <button 
                    onClick={() => handleDelete(p.id)} 
                    className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded border border-red-400/30 hover:bg-red-400/10 transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Project Insights Modal */}
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
