"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "../components/AuthForms/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.push("/dashboard");
  }, [router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white px-4 sm:px-6">
      {/* Animated glowing background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-gradient-to-r from-blue-700/30 to-purple-700/30 rounded-full blur-3xl top-1/3 left-[-100px] sm:left-[-200px] animate-pulse"></div>
        <div className="absolute w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-gradient-to-l from-indigo-800/30 to-cyan-700/30 rounded-full blur-3xl bottom-1/3 right-[-100px] sm:right-[-200px] animate-pulse"></div>
      </div>

      <div className="w-full max-w-md p-4 sm:p-8 backdrop-blur-xl bg-gradient-to-b from-gray-900/70 to-gray-800/60 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.7)] border border-gray-700/60 hover:shadow-[0_0_50px_rgba(0,150,255,0.25)] transition duration-300">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            HierarchIQ
          </h1>
          <p className="text-gray-400 mt-2 tracking-wide text-sm sm:text-base">
            Sign in to manage your team & projects
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <a
            href="/forgot-password"
            className="text-blue-400 hover:text-blue-300 transition duration-200"
          >
            Forgot your password?
          </a>

          <div className="mt-2">
            Don’t have an account?{" "}
            <a
              href="/register"
              className="text-purple-400 hover:text-purple-300 transition duration-200"
            >
              Register here
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
