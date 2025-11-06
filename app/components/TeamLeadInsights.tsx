"use client";

import { useState, useEffect } from "react";

interface Props {
  teamLeadId: string;
  teamLeadName: string;
  onClose: () => void;
}

export default function TeamLeadInsights({ teamLeadId, teamLeadName, onClose }: Props) {
  const [insights, setInsights] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTeamLeadInsights();
  }, [teamLeadId]);

  async function fetchTeamLeadInsights() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/team-lead-insights?teamLeadId=${teamLeadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate insights");
        return;
      }

      setInsights(data.insights);
      setStats(data.stats);
      setProjects(data.projects || []);
    } catch (err: any) {
      console.error("Error fetching team lead insights:", err);
      setError("Failed to load insights");
    } finally {
      setLoading(false);
    }
  }

  const formatInsights = (text: string) => {
    return text.split('\n').map((line, index) => {
      line = line.trim();
      if (!line) return null;

      if (line.includes('**')) {
        const headerText = line.replace(/\*\*/g, '');
        return (
          <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-white">
            {headerText}
          </h3>
        );
      }

      if (line.startsWith('•')) {
        return (
          <li key={index} className="text-gray-300 mb-1 ml-4">
            {line.substring(1).trim()}
          </li>
        );
      }

      return (
        <p key={index} className="text-gray-300 mb-2">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Team Lead Performance</h2>
            <p className="text-gray-400 text-sm mt-1">{teamLeadName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-2 hover:bg-gray-700 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-b border-gray-700">
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalProjects}</div>
                <div className="text-xs text-gray-400">Total Projects</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalTasks}</div>
                <div className="text-xs text-gray-400">Total Tasks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{stats.completedTasks}</div>
                <div className="text-xs text-gray-400">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{stats.inProgressTasks}</div>
                <div className="text-xs text-gray-400">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{stats.overallCompletion}%</div>
                <div className="text-xs text-gray-400">Completion Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Projects List */}
        {projects.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-700 max-h-32 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Managing Projects:</h3>
            <div className="flex flex-wrap gap-2">
              {projects.map((p) => (
                <span
                  key={p.id}
                  className="px-3 py-1 bg-indigo-900/30 border border-indigo-700 rounded-full text-xs text-indigo-300"
                >
                  {p.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-purple-300">
                <p className="text-center">Analyzing team lead performance...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-200">
              <p className="font-semibold">Error</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={fetchTeamLeadInsights}
                className="mt-3 text-sm px-3 py-1 bg-red-600 hover:bg-red-500 rounded transition"
              >
                Try Again
              </button>
            </div>
          ) : insights ? (
            <>
              <div className="space-y-1">
                {formatInsights(insights)}
              </div>
              <button
                onClick={fetchTeamLeadInsights}
                className="mt-6 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition"
              >
                Refresh Insights
              </button>
            </>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No insights available.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-700 bg-gray-900/50">
          <p className="text-xs text-gray-400 text-center">
            AI insights analyze this Team Lead's complete workload, projects, and task completion rates
          </p>
        </div>
      </div>
    </div>
  );
}
