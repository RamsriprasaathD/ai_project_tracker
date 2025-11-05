"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // Store user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userId", data.userId);
      
      // Set up authorization headers for all future requests
      const token = data.token;
      if (token) {
        const originalFetch = window.fetch;
        window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
          const headers = new Headers(init?.headers || {});
          headers.set("Authorization", `Bearer ${token}`);
          
          return originalFetch(input, {
            ...init,
            headers
          });
        };
      }
      
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-gray-900 text-white rounded-2xl p-8 shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        Don’t have an account?{" "}
        <a href="/register" className="text-blue-400 hover:text-blue-500">
          Register
        </a>
      </p>
    </div>
  );
}
