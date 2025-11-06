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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 sm:px-6">
      {/* Soft background patterns */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-gradient-to-r from-blue-100/40 to-indigo-100/40 rounded-full blur-3xl top-1/4 left-[-100px] sm:left-[-200px]"></div>
        <div className="absolute w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-gradient-to-l from-purple-100/40 to-blue-100/40 rounded-full blur-3xl bottom-1/4 right-[-100px] sm:right-[-200px]"></div>
      </div>

      <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            HierarchIQ
          </h1>
          <p className="text-gray-600 mt-2 tracking-wide text-sm sm:text-base">
            Sign in to manage your team & projects
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <a
            href="/forgot-password"
            className="text-blue-600 hover:text-blue-700 transition duration-200 font-medium"
          >
            Forgot your password?
          </a>

          <div className="mt-3">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-indigo-600 hover:text-indigo-700 transition duration-200 font-medium"
            >
              Register here
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
