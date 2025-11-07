"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import CreateTaskModal from "../components/modals/CreateTaskModal";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  project?: { title: string };
  assignee?: { name: string; email: string };
  creator?: { name: string; email: string };
  aiRiskScore?: number;
  dueDate?: string;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 🧠 Fetch Current User
  async function fetchCurrentUser() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");

      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("userRole", data.user.role);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  }

  // 🧠 Fetch all tasks
  async function fetchTasks() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");

      const res = await fetch("/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch tasks");

      setTasks(data.tasks || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  // Fetch user's projects for project selection
  async function fetchProjects() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.projects) {
        setProjects(data.projects.map((p: any) => ({ id: p.id, title: p.title })));
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  }

  useEffect(() => {
    fetchCurrentUser();
    fetchTasks();
    fetchProjects();
  }, []);

  const canCreateTasks = currentUser?.role !== "TEAM_MEMBER";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 p-6 overflow-y-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Task Management
          </h1>

          {/* Create Task Section */}
          {canCreateTasks ? (
            <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-md transition-colors duration-200 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  ➕ Create New Task
                </h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Create Task
                </button>
              </div>
              <p className="text-gray-600 text-sm">
                {currentUser?.role === "MANAGER" 
                  ? "Create tasks and assign them to your Team Leads"
                  : currentUser?.role === "TEAM_LEAD"
                  ? "Create tasks and assign them to your Team Members"
                  : "Create and manage your personal tasks"}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-md transition-colors duration-200 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Assigned Tasks</h2>
              <p className="text-gray-600 text-sm">
                View tasks assigned to you by your Team Lead. You can create sub-tasks for better organization.
              </p>
            </div>
          )}

          {/* 🧾 Task List */}
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p className="text-gray-600 animate-pulse">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="text-gray-600">No tasks found.</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`relative bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {task.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {task.description || "No description provided."}
                  </p>
                  <div className="space-y-1">
                    {task.project?.title && (
                      <p className="text-xs text-gray-500">
                        📁 Project: {task.project.title}
                      </p>
                    )}
                    {task.dueDate && (
                      <p className="text-xs text-orange-600">
                        📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {task.assignee && (
                      <p className="text-xs text-cyan-600">
                        👤 Assigned to: {task.assignee.name || task.assignee.email}
                      </p>
                    )}
                    {task.creator && currentUser?.role !== "INDIVIDUAL" && (
                      <p className="text-xs text-purple-600">
                        📋 Created by: {task.creator.name || task.creator.email}
                      </p>
                    )}
                  </div>

                  {/* Status Tag */}
                  <span
                    className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                      task.status === "DONE"
                        ? "bg-green-100 text-green-700"
                        : task.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-700"
                        : task.status === "BLOCKED"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {task.status}
                  </span>

                  {/* AI Risk Score */}
                  {task.aiRiskScore !== undefined && (
                    <div className="absolute top-3 right-3 bg-blue-50 px-2 py-1 rounded-lg text-xs text-cyan-600 border border-cyan-200">
                      ⚠️ Risk: {(task.aiRiskScore * 100).toFixed(0)}%
                    </div>
                  )}

                  {/* Action hint for team members */}
                  {currentUser?.role === "TEAM_MEMBER" && task.assignee?.email === currentUser?.email && (
                    <p className="mt-3 text-xs text-green-600 italic">
                      💡 You can create private sub-tasks to break down this task (only you can see them)
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <CreateTaskModal
              currentUser={currentUser}
              onClose={() => setShowCreateModal(false)}
              onSuccess={() => {
                setShowCreateModal(false);
                fetchTasks();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
