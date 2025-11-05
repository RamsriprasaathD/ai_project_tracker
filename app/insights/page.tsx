"use client";

import { useState, useEffect } from "react";
import InsightsPanel from "../components/InsightsPanel";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [projectIds, setProjectIds] = useState<string[]>([]);

  useEffect(() => {
    // Example fetch – modify as needed to fetch real project IDs
    async function fetchProjects() {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Missing token");

        const res = await fetch("/api/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok && Array.isArray(data.projects)) {
          setProjectIds(data.projects.map((p: any) => p.id));
        }
      } catch (err) {
        console.error("Insights fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center bg-gray-950 text-gray-400 text-lg animate-pulse">
        Loading insights...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-6 overflow-y-auto space-y-6">
          <section className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-md">
            <h1 className="text-2xl font-semibold mb-2">AI Insights 📊</h1>
            <p className="text-gray-400">
              Explore project summaries and performance trends powered by AI.
            </p>
          </section>

          {/* Insights Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projectIds.length ? (
              projectIds.map((id) => (
                <InsightsPanel key={id} projectId={id} />
              ))
            ) : (
              <p className="text-gray-500 text-sm">
                No projects found for insights.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
