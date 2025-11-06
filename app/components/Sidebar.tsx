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
    <aside className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 w-60 min-h-screen p-4 border-r border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Menu</h2>
      <nav className="flex flex-col space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;
          const active = path === item.path;
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                active
                  ? "bg-blue-500 text-white shadow-md"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              <Icon size={18} />
              <span className="font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
