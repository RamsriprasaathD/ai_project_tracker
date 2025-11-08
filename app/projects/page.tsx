"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import InsightsPanel from "../components/InsightsPanel";
import CreateProjectModal from "../components/modals/CreateProjectModal";

interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  assignedTo?: { name?: string; email: string };
  owner?: { name?: string; email: string };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
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
        // Store role in localStorage for quick access
        localStorage.setItem("userRole", data.user.role);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  }

  // 🧠 Fetch Projects
  async function fetchProjects() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");

      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load projects");

      setProjects(data.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCurrentUser();
    fetchProjects();
  }, []);

  const canCreateProjects =
    currentUser?.role === "MANAGER" ||
    currentUser?.role === "INDIVIDUAL" ||
    currentUser?.role === "TEAM_LEAD";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 p-6 overflow-y-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Projects Overview
          </h1>

          {/* Create Project Section */}
          {canCreateProjects ? (
            <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-md transition-colors duration-200 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  ➕ Create New Project
                </h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Create Project
                </button>
              </div>
              <p className="text-gray-600 text-sm">
                {currentUser?.role === "MANAGER"
                  ? "Create projects and assign them to your Team Leads"
                  : currentUser?.role === "TEAM_LEAD"
                  ? "Create projects for your team members and track their progress"
                  : "Create and manage your personal projects"}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-md transition-colors duration-200 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Assigned Projects</h2>
              <p className="text-gray-600 text-sm">
                {currentUser?.role === "TEAM_LEAD" 
                  ? "View projects assigned to you by your Manager"
                  : "View projects and tasks assigned to you by your Team Lead"}
              </p>
            </div>
          )}

          {/* Project List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p className="text-gray-600 animate-pulse">Loading projects...</p>
            ) : projects.length === 0 ? (
              <p className="text-gray-600">No projects found.</p>
            ) : (
              projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`cursor-pointer bg-white border rounded-xl p-5 hover:shadow-lg transition-all duration-300 ${
                    selectedProjectId === p.id
                      ? "ring-2 ring-blue-500 border-blue-500 shadow-md"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <h3 className="text-xl font-semibold text-gray-900">
                    {p.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1 mb-2">
                    {p.description || "No description provided."}
                  </p>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs">
                      Created: {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                    {p.assignedTo && (
                      <p className="text-blue-600 text-xs">
                        👤 Assigned to: {p.assignedTo.name || p.assignedTo.email}
                      </p>
                    )}
                    {p.owner && currentUser?.role !== "INDIVIDUAL" && (
                      <p className="text-indigo-600 text-xs">
                        📋 Created by: {p.owner.name || p.owner.email}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Insights Panel */}
          {selectedProjectId && (
            <div className="mt-8">
              <InsightsPanel projectId={selectedProjectId} />
            </div>
          )}
        </main>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <CreateProjectModal
              currentUser={currentUser}
              onClose={() => setShowCreateModal(false)}
              onSuccess={() => {
                setShowCreateModal(false);
                fetchProjects();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
