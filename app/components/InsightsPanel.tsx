"use client";

import { useState, useEffect } from "react";

interface Props {
  projectId: string;
}

export default function InsightsPanel({ projectId }: Props) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateInsights() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (res.ok) setSummary(data.summary);
      else setSummary("Error generating AI insights.");
    } catch (err) {
      console.error(err);
      setSummary("AI generation failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) generateInsights();
  }, [projectId]);

  return (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-lg text-white border border-gray-800">
      <h2 className="text-lg font-semibold mb-3 flex items-center">
        🧠 AI Insights
      </h2>
      {loading ? (
        <p className="text-gray-400 animate-pulse">Generating insights...</p>
      ) : (
        <p className="text-gray-300 whitespace-pre-line">{summary || "No insights available."}</p>
      )}
    </div>
  );
}
