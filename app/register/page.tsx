"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RegisterForm from "../components/AuthForms/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();

  // If user already logged in → redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.push("/dashboard");
  }, [router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* ✨ Animated glowing gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-purple-700/25 to-blue-700/25 rounded-full blur-3xl top-1/3 left-[-200px] animate-pulse"></div>
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-l from-cyan-700/25 to-indigo-800/25 rounded-full blur-3xl bottom-1/3 right-[-200px] animate-pulse"></div>
      </div>

      {/* 🪟 Glassy registration card */}
      <div className="w-full max-w-md p-8 backdrop-blur-xl bg-gradient-to-b from-gray-900/70 to-gray-800/60 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.7)] border border-gray-700/60 hover:shadow-[0_0_50px_rgba(147,51,234,0.3)] transition duration-300">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Create Your Account
          </h1>
          <p className="text-gray-400 mt-2 tracking-wide">
            Join the AI Project Tracker community
          </p>
        </div>

        {/* Registration Form */}
        <RegisterForm />

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>
            Already have an account?{" "}
            <a
              href="/login"
              className="text-blue-400 hover:text-blue-300 transition duration-200"
            >
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
