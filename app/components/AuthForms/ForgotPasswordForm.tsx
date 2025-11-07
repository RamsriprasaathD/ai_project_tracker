"use client";

import { useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // This is a placeholder for the actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage("If an account with that email exists, a password reset link has been sent.");
    } catch (err: any) {
      setError("Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-gray-600 text-sm font-medium mb-2">
          Email Address
        </label>
        <input
          type="email"
          className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
    </form>
  );
}
