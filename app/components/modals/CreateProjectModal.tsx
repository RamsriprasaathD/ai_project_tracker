"use client";
import { useState, useEffect } from "react";

export default function CreateProjectModal({ currentUser, onClose, onSuccess }: { currentUser: any; onClose?: () => void; onSuccess?: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [assignableUsers, setAssignableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchAssignableUsers();
  }, []);

  async function fetchAssignableUsers() {
    try {
      const res = await fetch("/api/assignable-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAssignableUsers(data.users || []);
      }
    } catch (err) {
      console.error("Error fetching assignable users:", err);
    }
  }

  async function handleCreate() {
    setError("");
    
    // Validation based on role
    if (!title) {
      setError("Project title is required");
      return;
    }

    if (currentUser?.role === "MANAGER" && !assignedTo) {
      setError("Please select a Team Lead to assign this project");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          deadline,
          assignedToId: currentUser?.role === "MANAGER" ? assignedTo : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create project");
        setLoading(false);
        return;
      }

      // Success
      setTitle("");
      setDescription("");
      setDeadline("");
      setAssignedTo("");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || "Error creating project");
    } finally {
      setLoading(false);
    }
  }

  // Role-based UI rendering
  const canCreateProjects = currentUser?.role === "MANAGER" || currentUser?.role === "INDIVIDUAL";

  if (!canCreateProjects) {
    return (
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl text-white">
        <h3 className="text-xl font-semibold mb-4 text-red-400">Access Denied</h3>
        <p className="text-gray-400">
          {currentUser?.role === "TEAM_LEAD" 
            ? "Team Leads cannot create projects. Only Managers can create projects and assign them to you."
            : "Team Members cannot create projects. View assigned projects from your Team Lead."}
        </p>
        {onClose && (
          <button onClick={onClose} className="mt-4 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl text-white">
      <h3 className="text-xl font-semibold mb-4 text-cyan-400">Create Project</h3>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Project title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mb-3 text-white"
      />
      <textarea
        placeholder="Project description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mb-3 text-white"
        rows={3}
      />
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mb-3 text-white"
        placeholder="Deadline (optional)"
      />
      
      {currentUser?.role === "MANAGER" && (
        <>
          <label className="block text-sm text-gray-400 mb-1">Assign to Team Lead *</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mb-3 text-white"
          >
            <option value="">Select Team Lead</option>
            {assignableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email} {u.tlIdWithinOrg ? `(TL-${u.tlIdWithinOrg})` : ""}
              </option>
            ))}
          </select>
        </>
      )}

      {currentUser?.role === "INDIVIDUAL" && (
        <p className="text-sm text-gray-400 mb-3 italic">
          This project will be assigned to you.
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleCreate}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition"
        >
          {loading ? "Creating..." : "Create Project"}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
