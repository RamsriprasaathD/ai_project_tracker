"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <nav className="w-full bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-lg border-b border-gray-800">
      <div className="text-2xl font-bold text-blue-400">AI Project Tracker</div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="hover:text-blue-400 transition"
        >
          Dashboard
        </button>
        <button
          onClick={() => router.push("/projects")}
          className="hover:text-blue-400 transition"
        >
          Projects
        </button>
        <button
          onClick={() => router.push("/tasks")}
          className="hover:text-blue-400 transition"
        >
          Tasks
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
