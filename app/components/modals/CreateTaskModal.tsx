"use client";
import { useState, useEffect } from "react";

export default function CreateTaskModal({ currentUser, projectId, onClose, onSuccess }: { currentUser: any; projectId?: string; onClose?: () => void; onSuccess?: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const [selectedProject, setSelectedProject] = useState(projectId || "");
  const [projects, setProjects] = useState<any[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPersonal, setIsPersonal] = useState(() => currentUser?.role === "TEAM_MEMBER");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (currentUser?.role === "TEAM_MEMBER") return;
    fetchAssignableUsers();
    fetchProjects();
  }, [currentUser?.role]);

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

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  }

  async function handleCreate() {
    setError("");
    
    // Validation based on role
    if (!title) {
      setError("Task title is required");
      return;
    }

    if (!isPersonal && (currentUser?.role === "MANAGER" || currentUser?.role === "TEAM_LEAD") && !assignee) {
      setError("Please select an assignee for this task");
      return;
    }

    if (!isPersonal && (currentUser?.role === "MANAGER" || currentUser?.role === "TEAM_LEAD") && !selectedProject) {
      setError("Please select a project for this task");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          dueDate,
          assigneeId: isPersonal ? undefined : currentUser?.role === "INDIVIDUAL" ? undefined : assignee,
          projectId: isPersonal ? null : selectedProject || null,
          isPersonal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create task");
        setLoading(false);
        return;
      }

      // Success
      setTitle("");
      setDescription("");
      setDueDate("");
      setAssignee("");
      setSelectedProject(projectId || "");
      setIsPersonal(currentUser?.role === "TEAM_MEMBER" ? true : false);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || "Error creating task");
    } finally {
      setLoading(false);
    }
  }

  // Role-based UI rendering
  const canCreateTasks = currentUser?.role !== "TEAM_MEMBER";

  if (!canCreateTasks) {
    return (
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl text-white">
        <h3 className="text-xl font-semibold mb-4 text-red-400">Access Denied</h3>
        <p className="text-gray-400">
          Team Members cannot create tasks. You can only create sub-tasks for tasks assigned to you.
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
    <div className="bg-gray-900 border border-gray-700 p-4 sm:p-6 rounded-xl text-white max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg sm:text-xl font-semibold mb-4 text-green-400">Create Task</h3>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {currentUser?.role === "TEAM_MEMBER" && (
        <div className="mb-4 text-sm text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-lg px-3 py-2">
          Personal task mode is enabled. These tasks remain private to you and do not appear in your team lead's dashboard.
        </div>
      )}

      {currentUser?.role === "TEAM_LEAD" && (
        <label className="flex items-center gap-2 text-sm text-gray-300 mb-4">
          <input
            type="checkbox"
            checked={isPersonal}
            onChange={(e) => {
              setIsPersonal(e.target.checked);
              if (e.target.checked) {
                setAssignee("");
                setSelectedProject("");
              }
            }}
            className="accent-green-500"
          />
          Create as a personal task (kept separate from organizational projects)
        </label>
      )}

      <input
        type="text"
        placeholder="Task title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mb-3 text-white"
      />
      <textarea
        placeholder="Task description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mb-3 text-white"
        rows={3}
      />
      <div className="mb-3">
        <label className="block text-sm text-gray-400 mb-1">Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
        />
        <p className="text-xs text-gray-500 mt-1">Optional - Set a deadline for this task</p>
      </div>
      
      {/* Project Selector - only shown when not pre-selected and user is Manager or Team Lead */}
      {!projectId && !isPersonal && (currentUser?.role === "MANAGER" || currentUser?.role === "TEAM_LEAD") && (
        <>
          <label className="block text-sm text-gray-400 mb-1">Project *</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mb-3 text-white"
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Show selected project when pre-selected */}
      {projectId && !isPersonal && (
        <div className="mb-3 p-2 bg-indigo-900/30 border border-indigo-700 rounded-lg text-sm text-gray-300">
          Task will be added to the selected project
        </div>
      )}
      
      {currentUser?.role === "MANAGER" && !isPersonal && (
        <>
          <label className="block text-sm text-gray-400 mb-1">Assign to Team Lead *</label>
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
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

      {currentUser?.role === "TEAM_LEAD" && !isPersonal && (
        <>
          <label className="block text-sm text-gray-400 mb-1">Assign to Team Member *</label>
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mb-3 text-white"
          >
            <option value="">Select Team Member</option>
            {assignableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
        </>
      )}

      {(currentUser?.role === "INDIVIDUAL" || isPersonal) && (
        <p className="text-sm text-gray-400 mb-3 italic">
          This task will be assigned to you.
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleCreate}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition"
        >
          {loading ? "Creating..." : "Create Task"}
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
