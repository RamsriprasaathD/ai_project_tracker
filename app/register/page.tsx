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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4 sm:px-6 py-8">
      {/* Soft background patterns */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-gradient-to-r from-purple-100/40 to-blue-100/40 rounded-full blur-3xl top-1/3 left-[-100px] sm:left-[-200px]"></div>
        <div className="absolute w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-gradient-to-l from-blue-100/40 to-indigo-100/40 rounded-full blur-3xl bottom-1/3 right-[-100px] sm:right-[-200px]"></div>
      </div>

      {/* Registration card */}
      <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Join HierarchIQ
          </h1>
          <p className="text-gray-600 mt-2 tracking-wide text-sm sm:text-base">
            Create your account to get started
          </p>
        </div>

        {/* Registration Form */}
        <RegisterForm />

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Already have an account?{" "}
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-700 transition duration-200 font-medium"
            >
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
