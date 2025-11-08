// app/components/TaskTable.tsx
"use client";

import React, { useState } from "react";
import SubTaskTable from "./SubTaskTable";

export default function TaskTable({ tasks = [], currentUser, onRefresh }: { tasks?: any[], currentUser: any, onRefresh?: () => Promise<void> }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  async function updateStatus(taskId: string, status: string) {
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`! },
        body: JSON.stringify({ id: taskId, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update status");
        return;
      }
      if (onRefresh) await onRefresh();
    } catch (err) {
      alert("Error updating task status");
    }
  }

  function toggleTaskExpansion(taskId: string) {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-4 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-green-400">Tasks</h2>
        <p className="text-gray-600 text-center py-8">
          {currentUser?.role === "TEAM_MEMBER" 
            ? "No tasks assigned to you yet."
            : "No tasks found. Create your first task!"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 p-4 rounded-xl">
      <h2 className="text-xl font-semibold mb-4 text-green-400">Tasks</h2>
      <div className="space-y-3">
        {tasks.map((t) => {
          const isAssignedToUser = t.assigneeId === currentUser?.id;
          const canManageSubtasks = currentUser?.role === "TEAM_MEMBER" && isAssignedToUser;
          const canUpdateStatus = isAssignedToUser;
          const isExpanded = expandedTasks.has(t.id);

          return (
            <div key={t.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-green-500 transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-lg mb-1">{t.title}</div>
                  <div className="text-sm text-gray-600 mb-2">{t.description || "No description"}</div>
                  
                  <div className="space-y-1">
                    {/* Hide project details from Team Members to maintain hierarchy privacy */}
                    {t.project?.title && currentUser?.role !== "TEAM_MEMBER" && (
                      <div className="text-xs text-gray-500">📁 Project: {t.project.title}</div>
                    )}
                    {t.dueDate && (
                      <div className="text-xs text-orange-600">
                        📅 Due: {new Date(t.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    {t.assignee && (
                      <div className="text-xs text-cyan-600">
                        👤 Assigned to: {t.assignee.name || t.assignee.email}
                      </div>
                    )}
                    {/* Hide creator info from Team Members and Individuals to maintain hierarchy privacy */}
                    {t.creator && currentUser?.role !== "INDIVIDUAL" && currentUser?.role !== "TEAM_MEMBER" && (
                      <div className="text-xs text-purple-600">
                        📋 Created by: {t.creator.name || t.creator.email}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  {/* Status dropdown */}
                  {canUpdateStatus && (
                    <select
                      value={t.status}
                      onChange={(e) => updateStatus(t.id, e.target.value)}
                      className="bg-white text-gray-900 rounded-md px-3 py-1 text-sm border border-gray-300 hover:border-green-400 transition"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  )}
                  {!canUpdateStatus && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      t.status === "DONE" ? "bg-green-100 text-green-700" :
                      t.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                      t.status === "BLOCKED" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {t.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-tasks section - ONLY visible to assigned team member */}
              {canManageSubtasks && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => toggleTaskExpansion(t.id)}
                      className="text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1"
                    >
                      {isExpanded ? "▼" : "▶"} My Sub-tasks {t.subtasks?.length > 0 ? `(${t.subtasks.length})` : ""}
                    </button>
                    <span className="text-xs text-gray-500 italic">Private - only you can see these</span>
                  </div>
                  {isExpanded && (
                    <SubTaskTable parentTaskId={t.id} currentUser={currentUser} onRefresh={onRefresh} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
