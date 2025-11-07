"use client";
import { useState, useEffect } from "react";

interface SubTask {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
}

interface SubTaskTableProps {
  parentTaskId: string;
  currentUser?: any;
  onRefresh?: () => Promise<void>;
}

export default function SubTaskTable({ parentTaskId, currentUser, onRefresh }: SubTaskTableProps) {
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!parentTaskId) return;
    fetch(`/api/tasks?id=${parentTaskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setSubtasks(data.task?.subtasks || []))
      .catch(console.error);
  }, [parentTaskId]);

  async function addSubtask() {
    if (!newSubtask.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/subtasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ parentTaskId, title: newSubtask }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create subtask");
        return;
      }
      
      setNewSubtask("");
      
      // Refresh subtasks
      const refreshRes = await fetch(`/api/tasks?id=${parentTaskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshData = await refreshRes.json();
      setSubtasks(refreshData.task?.subtasks || []);
      
      // Call parent refresh if provided
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      setError(err.message || "Error creating subtask");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setError("");
    try {
      const res = await fetch("/api/subtasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update subtask");
        return;
      }
      
      setSubtasks((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: status as any } : s))
      );
      
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      setError(err.message || "Error updating subtask");
    }
  }

  async function deleteSubtask(id: string) {
    if (!confirm("Delete this subtask?")) return;
    setError("");
    try {
      const res = await fetch(`/api/subtasks?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete subtask");
        return;
      }
      
      setSubtasks((prev) => prev.filter((s) => s.id !== id));
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      setError(err.message || "Error deleting subtask");
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <h3 className="text-lg font-semibold text-purple-600 mb-2">Sub-tasks</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex mb-3 gap-2">
        <input
          type="text"
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addSubtask()}
          placeholder="New sub-task title..."
          className="flex-1 bg-white border border-gray-300 px-3 py-2 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={addSubtask}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>

      {subtasks.length > 0 ? (
        <ul className="space-y-2">
          {subtasks.map((s) => (
            <li
              key={s.id}
              className="flex justify-between items-center gap-2 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="flex-1 text-sm text-gray-900">{s.title}</span>
              <div className="flex gap-2 items-center">
                <select
                  value={s.status}
                  onChange={(e) => updateStatus(s.id, e.target.value)}
                  className="bg-gray-100 border border-gray-300 rounded-md text-xs text-gray-900 px-2 py-1 hover:border-purple-400 transition"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
                <button
                  onClick={() => deleteSubtask(s.id)}
                  className="text-red-500 hover:text-red-400 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50 transition"
                  title="Delete subtask"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm italic">No sub-tasks yet. Add one to break down this task!</p>
      )}
    </div>
  );
}
