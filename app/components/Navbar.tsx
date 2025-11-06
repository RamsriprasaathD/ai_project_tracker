"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Projects", path: "/projects" },
    { label: "Tasks", path: "/tasks" },
    { label: "Insights", path: "/insights" },
  ];

  return (
    <nav className="w-full bg-white text-gray-800 px-4 sm:px-6 py-3 sm:py-4 shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <div 
          className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          onClick={() => router.push("/dashboard")}
        >
          HierarchIQ
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md ml-2"
          >
            Logout
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-4 pb-2 space-y-2 border-t border-gray-200 pt-4">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                router.push(item.path);
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              handleLogout();
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all duration-200"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
