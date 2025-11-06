"use client";

import { useState, useEffect } from "react";

interface Props {
  currentUser: any;
}

export default function DashboardInsights({ currentUser }: Props) {
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchInsights() {
    if (!currentUser) return;
    
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/dashboard-insights", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to generate insights");
        return;
      }
      
      setInsights(data.insights);
    } catch (err: any) {
      console.error("Error fetching insights:", err);
      setError("Failed to load insights");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchInsights();
    }
  }, [currentUser]);

  const formatInsights = (text: string) => {
    // Split by lines and format
    return text.split('\n').map((line, index) => {
      line = line.trim();
      if (!line) return null;
      
      // Check if line is a header (contains **)
      if (line.includes('**')) {
        const headerText = line.replace(/\*\*/g, '');
        return (
          <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-white">
            {headerText}
          </h3>
        );
      }
      
      // Check if line is a bullet point
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
    <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-700/50 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-purple-300 flex items-center gap-2">
          AI Insights
        </h2>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="text-sm px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition"
        >
          {loading ? "Generating..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-purple-300">
            <p className="text-center">Analyzing your dashboard...</p>
            <p className="text-sm text-gray-400 text-center mt-2">This may take a few seconds</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-200">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchInsights}
            className="mt-3 text-sm px-3 py-1 bg-red-600 hover:bg-red-500 rounded transition"
          >
            Try Again
          </button>
        </div>
      ) : insights ? (
        <div className="space-y-1">
          {formatInsights(insights)}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-8">
          No insights available. Click refresh to generate.
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-purple-700/30 text-xs text-gray-400">
        <p>Note: AI insights are generated based on your current dashboard data and role-specific responsibilities.</p>
      </div>
    </div>
  );
}
