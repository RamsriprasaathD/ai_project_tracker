"use client";

import { useState } from "react";

interface Props {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}

export default function ProjectInsights({ projectId, projectTitle, onClose }: Props) {
  const [insights, setInsights] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  async function fetchProjectInsights() {
    if (!projectId) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/project-insights?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate insights");
        return;
      }

      setInsights(data.insights);
      setStats(data.stats);
      setProjectInfo(data.project);
      setHasLoaded(true);
    } catch (err: any) {
      console.error("Error fetching project insights:", err);
      setError("Failed to load project insights");
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
            <h2 className="text-2xl font-bold text-white">Project Analysis</h2>
            <p className="text-gray-400 text-sm mt-1">{projectTitle}</p>
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
          <div className="px-6 py-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-b border-gray-700">
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{stats.completionPercentage}%</div>
                <div className="text-xs text-gray-400">Complete</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{stats.completedTasks}</div>
                <div className="text-xs text-gray-400">Done</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{stats.inProgressTasks}</div>
                <div className="text-xs text-gray-400">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">{stats.blockedTasks}</div>
                <div className="text-xs text-gray-400">Blocked</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-400">{stats.todoTasks}</div>
                <div className="text-xs text-gray-400">To Do</div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!hasLoaded ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-400 mb-4">Click the button below to generate AI-powered insights for this project</p>
              <button
                onClick={fetchProjectInsights}
                disabled={loading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition font-semibold"
              >
                {loading ? "Generating Insights..." : "Generate Insights"}
              </button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-purple-300">
                <p className="text-center">Analyzing project data...</p>
                <p className="text-sm text-gray-400 text-center mt-2">This may take a few seconds</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-200">
              <p className="font-semibold">Error</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={fetchProjectInsights}
                className="mt-3 text-sm px-3 py-1 bg-red-600 hover:bg-red-500 rounded transition"
              >
                Try Again
              </button>
            </div>
          ) : insights ? (
            <>
              {projectInfo && projectInfo.assignedTo && (
                <div className="mb-4 p-3 bg-indigo-900/30 border border-indigo-700 rounded-lg">
                  <p className="text-sm text-gray-300">
                    Assigned to: <span className="font-semibold text-white">{projectInfo.assignedTo}</span>
                  </p>
                </div>
              )}
              <div className="space-y-1">
                {formatInsights(insights)}
              </div>
              <button
                onClick={fetchProjectInsights}
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
            AI insights analyze the Team Lead's dashboard, task completion rates, and overall project progress
          </p>
        </div>
      </div>
    </div>
  );
}
