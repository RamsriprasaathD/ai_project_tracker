"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import CreateTaskModal from "../../components/modals/CreateTaskModal";
import TaskTable from "../../components/TaskTable";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Fetch current user
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
      } else {
        router.push("/login");
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      router.push("/login");
    }
  }

  // Fetch project details
  async function fetchProject() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");

      const res = await fetch(`/api/projects?id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.projects && data.projects.length > 0) {
        setProject(data.projects[0]);
      } else {
        alert("Project not found or access denied");
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Error fetching project:", err);
    }
  }

  // Fetch tasks for this project
  async function fetchTasks() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        // Filter tasks for this project only
        const projectTasks = (data.tasks || []).filter(
          (task: any) => task.projectId === projectId
        );
        setTasks(projectTasks);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchCurrentUser();
    }
  }, [projectId]);

  useEffect(() => {
    if (currentUser) {
      fetchProject();
      fetchTasks();
    }
  }, [currentUser]);

  // Calculate project statistics
  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === "DONE").length,
    inProgressTasks: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    blockedTasks: tasks.filter((t) => t.status === "BLOCKED").length,
    todoTasks: tasks.filter((t) => t.status === "TODO").length,
  };

  const completionPercentage =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  const handleRefresh = async () => {
    setLoading(true);
    await fetchTasks();
  };

  if (loading && !project) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64">
        <Navbar />

        <main className="flex-1 p-8 mt-16 overflow-y-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-4 text-sm text-gray-400 hover:text-white flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>

          {/* Project Header */}
          <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-700 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {project?.title}
                </h1>
                <p className="text-gray-300 mb-4">
                  {project?.description || "No description"}
                </p>

                <div className="flex gap-4 text-sm">
                  {project?.owner && (
                    <div className="text-gray-400">
                      Created by:{" "}
                      <span className="text-purple-300">
                        {project.owner.name || project.owner.email}
                      </span>
                    </div>
                  )}
                  {project?.assignedTo && (
                    <div className="text-gray-400">
                      Assigned to:{" "}
                      <span className="text-cyan-300">
                        {project.assignedTo.name || project.assignedTo.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Only show create task button for TL and Manager */}
              {(currentUser?.role === "TEAM_LEAD" ||
                currentUser?.role === "MANAGER") && (
                <button
                  onClick={() => setShowCreateTaskModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-semibold shadow-lg"
                >
                  + Create Task
                </button>
              )}
            </div>
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-6 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">
                {completionPercentage}%
              </div>
              <div className="text-sm text-gray-400">Complete</div>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">
                {stats.totalTasks}
              </div>
              <div className="text-sm text-gray-400">Total Tasks</div>
            </div>
            <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">
                {stats.completedTasks}
              </div>
              <div className="text-sm text-gray-400">Done</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">
                {stats.inProgressTasks}
              </div>
              <div className="text-sm text-gray-400">In Progress</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 border border-red-700 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-400">
                {stats.blockedTasks}
              </div>
              <div className="text-sm text-gray-400">Blocked</div>
            </div>
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-400">
                {stats.todoTasks}
              </div>
              <div className="text-sm text-gray-400">To Do</div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">
              Project Tasks
            </h2>

            {loading ? (
              <p className="text-gray-400 animate-pulse">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">
                  No tasks in this project yet.
                </p>
                {(currentUser?.role === "TEAM_LEAD" ||
                  currentUser?.role === "MANAGER") && (
                  <button
                    onClick={() => setShowCreateTaskModal(true)}
                    className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold"
                  >
                    Create First Task
                  </button>
                )}
              </div>
            ) : (
              <TaskTable
                tasks={tasks}
                currentUser={currentUser}
                onRefresh={handleRefresh}
              />
            )}
          </div>
        </main>
      </div>

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <CreateTaskModal
              currentUser={currentUser}
              projectId={projectId}
              onClose={() => setShowCreateTaskModal(false)}
              onSuccess={() => {
                setShowCreateTaskModal(false);
                handleRefresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
