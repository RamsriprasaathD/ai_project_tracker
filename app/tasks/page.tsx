"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  project?: { title: string };
  assignee?: { name: string };
  aiRiskScore?: number;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    projectId: "",
    assigneeId: "",
  });

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

  // ➕ Create a new task
  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title) return alert("Task title is required");

    try {
      setCreating(true);
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("userRole");

      // Check permissions client-side first
      if (!userRole || (userRole !== "MANAGER" && userRole !== "TEAM_LEAD" && userRole !== "INDIVIDUAL")) {
        throw new Error("You don't have permission to create tasks. Only managers, team leads, and individuals can create tasks.");
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTask),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create task");

      setNewTask({ title: "", description: "", projectId: "", assigneeId: "" });
      fetchTasks(); // Refresh list
    } catch (err) {
      console.error(err);
      alert("Error creating task");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 p-6 overflow-y-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent mb-6">
            Task Management
          </h1>

          {/* ➕ Create Task Form */}
          <div className="bg-gradient-to-b from-gray-900/80 to-gray-800/60 border border-gray-700 rounded-2xl p-6 shadow-lg backdrop-blur-xl mb-8">
            <h2 className="text-xl font-semibold text-blue-400 mb-4 flex items-center gap-2">
              ➕ Create New Task
            </h2>
            <form
              onSubmit={createTask}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <input
                type="text"
                placeholder="Task Title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newTask.projectId}
                onChange={e => setNewTask({ ...newTask, projectId: e.target.value })}
                className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Description (optional)"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={creating}
                className="col-span-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 p-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
              >
                {creating ? "Creating..." : "Create Task"}
              </button>
            </form>
          </div>

          {/* 🧾 Task List */}
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p className="text-gray-400 animate-pulse">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="text-gray-500">No tasks found.</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`relative bg-gradient-to-b from-gray-900/80 to-gray-800/60 border border-gray-700 rounded-xl p-5 shadow-md hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all duration-300`}
                >
                  <h3 className="text-lg font-semibold text-blue-300 mb-1">
                    {task.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">
                    {task.description || "No description provided."}
                  </p>
                  <p className="text-xs text-gray-500">
                    {task.project?.title ? `Project: ${task.project.title}` : ""}
                  </p>

                  {/* Status Tag */}
                  <span
                    className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                      task.status === "DONE"
                        ? "bg-green-700 text-white"
                        : task.status === "IN_PROGRESS"
                        ? "bg-blue-700 text-white"
                        : task.status === "BLOCKED"
                        ? "bg-red-700 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {task.status}
                  </span>

                  {/* AI Risk Score */}
                  {task.aiRiskScore !== undefined && (
                    <div className="absolute top-3 right-3 bg-gray-800 px-2 py-1 rounded-lg text-xs text-cyan-400 border border-cyan-700">
                      ⚠️ Risk: {(task.aiRiskScore * 100).toFixed(0)}%
                    </div>
                  )}

                  {/* Assignee */}
                  <p className="mt-3 text-sm text-gray-400 italic">
                    {task.assignee
                      ? `👤 Assigned to: ${task.assignee.name}`
                      : "Unassigned"}
                  </p>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
