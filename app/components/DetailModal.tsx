"use client";

import React, { useEffect, useState } from "react";

type DetailModalProps = {
  type: "task" | "project";
  item: any;
  currentUser: any;
  onClose: () => void;
};

export default function DetailModal({ type, item, currentUser, onClose }: DetailModalProps) {
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);

  if (!item) return null;

  const isTask = type === "task";
  const title = item.title || "Untitled";
  const description = item.description || "No description";
  const status = item.status || "TODO";
  
  // Get assignee info
  const assignee = item.assignee || item.assignedTo;
  const assigneeName = assignee?.name || assignee?.email || "Not assigned";
  
  // Get creator/owner info
  const creator = item.creator || item.owner;
  const creatorName = creator?.name || creator?.email || "Unknown";
  
  // Additional info
  const dueDate = item.dueDate || item.deadline;
  const projectInfo = isTask ? item.project : null;

  const statusColors: Record<string, string> = {
    TODO: "bg-gray-100 text-gray-700 border-gray-300",
    IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-300",
    DONE: "bg-green-100 text-green-700 border-green-300",
    BLOCKED: "bg-red-100 text-red-700 border-red-300",
  };

  const statusLabels: Record<string, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    DONE: "Done",
    BLOCKED: "Blocked",
  };

  // Fetch subtasks if this is a task and user is Team Lead or Manager
  useEffect(() => {
    async function fetchSubtasks() {
      if (!isTask || (currentUser?.role !== "TEAM_LEAD" && currentUser?.role !== "MANAGER")) return;
      
      setLoadingSubtasks(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`/api/subtasks?parentId=${item.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setSubtasks(data.subtasks || []);
        }
      } catch (error) {
        console.error("Error fetching subtasks:", error);
      } finally {
        setLoadingSubtasks(false);
      }
    }

    fetchSubtasks();
  }, [isTask, item.id, currentUser?.role]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-amber-50 via-white to-blue-50 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">{isTask ? "✓" : "📁"}</span>
            <h2 className="text-lg sm:text-2xl font-bold text-white">
              {isTask ? "Task Details" : "Project Details"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Title Section */}
          <div className="bg-white rounded-xl p-3 sm:p-5 shadow-sm border border-gray-200">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              {isTask ? "Task Name" : "Project Name"}
            </label>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h3>
          </div>

          {/* Status Badge */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              Status
            </label>
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${
                statusColors[status] || statusColors.TODO
              }`}
            >
              {statusLabels[status] || status}
            </span>
          </div>

          {/* Description Section */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              Description
            </label>
            <p className="text-gray-700 leading-relaxed">{description}</p>
          </div>

          {/* Project Info (for tasks only) */}
          {isTask && projectInfo && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 shadow-sm border border-orange-200">
              <label className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2 block flex items-center gap-2">
                📁 Project
              </label>
              <p className="text-gray-900 font-semibold text-lg">
                {projectInfo.title || projectInfo.name || "Unknown Project"}
              </p>
            </div>
          )}

          {/* Due Date / Deadline */}
          {dueDate && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-5 shadow-sm border border-orange-200">
              <label className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2 block flex items-center gap-2">
                📅 {isTask ? "Due Date" : "Deadline"}
              </label>
              <p className="text-gray-900 font-semibold text-lg">
                {new Date(dueDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          {/* Assignee Section */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-5 shadow-sm border border-cyan-200">
            <label className="text-xs font-semibold text-cyan-700 uppercase tracking-wide mb-2 block flex items-center gap-2">
              👤 Assigned To
            </label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                {assigneeName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-lg">{assigneeName}</p>
                {assignee?.email && assignee.email !== assigneeName && (
                  <p className="text-sm text-gray-600">{assignee.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Creator Section */}
          {creator && currentUser?.role !== "INDIVIDUAL" && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 shadow-sm border border-purple-200">
              <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2 block flex items-center gap-2">
                📋 Created By
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {creatorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-gray-900 font-semibold text-lg">{creatorName}</p>
                  {creator?.email && creator.email !== creatorName && (
                    <p className="text-sm text-gray-600">{creator.email}</p>
                  )}
                  {creator?.role && (
                    <p className="text-xs text-purple-600 font-medium mt-1">
                      {creator.role.replace("_", " ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Task count for projects */}
          {!isTask && item.tasks && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 shadow-sm border border-green-200">
              <label className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2 block flex items-center gap-2">
                ✓ Tasks
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Total Tasks</p>
                  <p className="text-gray-900 font-bold text-2xl">{item.tasks.length}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Completed</p>
                  <p className="text-green-600 font-bold text-2xl">
                    {item.tasks.filter((t: any) => t.status === "DONE").length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Subtasks Section (Team Lead & Manager View) */}
          {isTask && (currentUser?.role === "TEAM_LEAD" || currentUser?.role === "MANAGER") && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 shadow-sm border border-indigo-200">
              <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-3 block flex items-center gap-2">
                📋 Team Member Sub-tasks
                <span className="text-xs text-gray-500 font-normal normal-case">(Created by assigned member)</span>
              </label>
              
              {loadingSubtasks ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 text-sm animate-pulse">Loading subtasks...</p>
                </div>
              ) : subtasks.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {subtasks.map((subtask: any) => (
                    <div
                      key={subtask.id}
                      className="bg-white rounded-lg p-4 border border-indigo-200 hover:border-indigo-400 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{subtask.title}</h4>
                          {subtask.description && (
                            <p className="text-sm text-gray-600 mb-2">{subtask.description}</p>
                          )}
                          {subtask.assignee && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                                {(subtask.assignee.name || subtask.assignee.email).charAt(0).toUpperCase()}
                              </span>
                              <span>{subtask.assignee.name || subtask.assignee.email}</span>
                            </div>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            statusColors[subtask.status] || statusColors.TODO
                          }`}
                        >
                          {statusLabels[subtask.status] || subtask.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No subtasks created yet</p>
                  <p className="text-gray-400 text-xs mt-1">Team member can break down this task into subtasks</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-2xl border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
