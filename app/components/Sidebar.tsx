"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, Folder, CheckSquare, Brain } from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const path = usePathname();

  const menu = [
    { name: "Dashboard", icon: Home, path: "/dashboard" },
    { name: "Projects", icon: Folder, path: "/projects" },
    { name: "Tasks", icon: CheckSquare, path: "/tasks" },
    { name: "Insights", icon: Brain, path: "/insights" },
  ];

  return (
    <aside className="bg-gray-950 text-gray-200 w-60 min-h-screen p-4 border-r border-gray-800">
      <h2 className="text-xl font-bold text-blue-400 mb-6">Menu</h2>
      <nav className="flex flex-col space-y-3">
        {menu.map((item) => {
          const Icon = item.icon;
          const active = path === item.path;
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-800 hover:text-blue-400"
              }`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
