"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔒 Redirect if no token
  useEffect(() => {
    if (!token) {
      setMessage("❌ Invalid or expired reset link.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!password || !confirm) {
      setMessage("⚠️ Please fill both fields.");
      return;
    }
    if (password !== confirm) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");

      setMessage("✅ Password reset successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* 🌌 Background Gradient Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-purple-700/25 to-blue-700/25 rounded-full blur-3xl top-1/3 left-[-200px] animate-pulse"></div>
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-l from-cyan-700/25 to-indigo-800/25 rounded-full blur-3xl bottom-1/3 right-[-200px] animate-pulse"></div>
      </div>

      <div className="w-full max-w-md p-8 backdrop-blur-xl bg-gradient-to-b from-gray-900/70 to-gray-800/60 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.7)] border border-gray-700/60 hover:shadow-[0_0_50px_rgba(79,70,229,0.3)] transition duration-300">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            Reset Your Password
          </h1>
          <p className="text-gray-400 mt-2">
            Enter your new password below to continue.
          </p>
        </div>

        {token ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />

            {message && (
              <p
                className={`text-center text-sm ${
                  message.startsWith("✅")
                    ? "text-green-400"
                    : message.startsWith("⚠️")
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 p-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        ) : (
          <p className="text-red-400 text-center">{message}</p>
        )}

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>
            Back to{" "}
            <a
              href="/login"
              className="text-blue-400 hover:text-blue-300 transition duration-200"
            >
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
