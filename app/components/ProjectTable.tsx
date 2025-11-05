import React from "react";
import { ITask, IUser } from "../types/types";

interface ProjectTableProps {
  tasks: (ITask & { assignee?: IUser | null; dueDate?: string | Date })[];
  users: IUser[];
  onAssign?: (taskId: string, assigneeId: string) => void;
  onEdit?: (task: ITask) => void;
  onDelete?: (taskId: string) => void;
  canAssign?: boolean;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ tasks, users, onAssign, onEdit, onDelete, canAssign }) => {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
          {canAssign && <th className="px-6 py-3">Actions</th>}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {tasks.map((task) => (
          <tr key={task.id}>
            <td className="px-6 py-4 whitespace-nowrap">{task.title}</td>
            <td className="px-6 py-4 whitespace-nowrap">{task.assignee?.name || "Unassigned"}</td>
            <td className="px-6 py-4 whitespace-nowrap">{task.status}</td>
            <td className="px-6 py-4 whitespace-nowrap">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}</td>
            {canAssign && (
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={task.assigneeId || ""}
                  onChange={e => onAssign && onAssign(task.id, e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
                <button className="ml-2 text-blue-500" onClick={() => onEdit && onEdit(task)}>Edit</button>
                <button className="ml-2 text-red-500" onClick={() => onDelete && onDelete(task.id)}>Delete</button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ProjectTable;

