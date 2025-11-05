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
    <div className="flex flex-col items-center justify-center min-h-screen text-white relative overflow-hidden">
      {/* Background Gradient Animation */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-blue-700/30 to-purple-700/30 rounded-full blur-3xl top-1/3 left-[-200px] animate-pulse"></div>
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-l from-indigo-800/30 to-cyan-700/30 rounded-full blur-3xl bottom-1/3 right-[-200px] animate-pulse"></div>
      </div>

      {/* Logo / Title */}
      <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent mb-3">
        AI Project Tracker
      </h1>

      <p className="text-gray-400 mb-6 text-center max-w-sm">
        Smart project insights, AI summaries, and effortless task management — powered by Groq.
      </p>

      {/* Animated Loader */}
      <div className="flex gap-2">
        <span className="w-3 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></span>
      </div>

      <p className="mt-8 text-sm text-gray-500 italic">
        Redirecting you to your workspace...
      </p>
    </div>
  );
}
