"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    // Redirect based on auth state
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden px-4 sm:px-6">
      {/* Background Gradient Animation */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-gradient-to-r from-blue-100/40 to-purple-100/40 rounded-full blur-3xl top-1/3 left-[-100px] sm:left-[-200px]"></div>
        <div className="absolute w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-gradient-to-l from-indigo-100/40 to-blue-100/40 rounded-full blur-3xl bottom-1/3 right-[-100px] sm:right-[-200px]"></div>
      </div>

      {/* Logo / Title */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 text-center">
        HierarchIQ
      </h1>

      <p className="text-gray-600 mb-6 text-center max-w-sm text-sm sm:text-base px-4">
        Smart hierarchical project management with AI-powered insights and seamless team collaboration.
      </p>

      {/* Animated Loader */}
      <div className="flex gap-2">
        <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></span>
      </div>

      <p className="mt-8 text-sm text-gray-500 italic">
        Redirecting you to your workspace...
      </p>
    </div>
  );
}
