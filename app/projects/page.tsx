"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import InsightsPanel from "../components/InsightsPanel";

interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({ title: "", description: "" });

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

  // ➕ Create Project
  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProject.title) return alert("Project title is required");

    try {
      setCreating(true);
      const token = localStorage.getItem("token");

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newProject),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project");

      setNewProject({ title: "", description: "" });
      fetchProjects(); // refresh
    } catch (err) {
      console.error(err);
      alert("Error creating project");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
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
            Projects Overview
          </h1>

          {/* Create Project Section */}
          <div className="bg-gradient-to-b from-gray-900/80 to-gray-800/60 border border-gray-700 rounded-2xl p-6 shadow-lg backdrop-blur-xl mb-8">
            <h2 className="text-xl font-semibold text-blue-400 mb-4 flex items-center gap-2">
              ➕ Create New Project
            </h2>
            <form onSubmit={createProject} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Project Title"
                value={newProject.title}
                onChange={(e) =>
                  setNewProject({ ...newProject, title: e.target.value })
                }
                className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Short Description"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={creating}
                className="col-span-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 p-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
              >
                {creating ? "Creating..." : "Create Project"}
              </button>
            </form>
          </div>

          {/* Project List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p className="text-gray-400 animate-pulse">Loading projects...</p>
            ) : projects.length === 0 ? (
              <p className="text-gray-500">No projects found.</p>
            ) : (
              projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`cursor-pointer bg-gradient-to-br from-gray-900/80 to-gray-800/60 border border-gray-700 rounded-xl p-5 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all duration-300 ${
                    selectedProjectId === p.id
                      ? "ring-2 ring-blue-500"
                      : "hover:ring-1 hover:ring-blue-400"
                  }`}
                >
                  <h3 className="text-xl font-semibold text-blue-300">
                    {p.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1 mb-2">
                    {p.description || "No description provided."}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Created on {new Date(p.createdAt).toLocaleDateString()}
                  </p>
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
    </div>
  );
}
