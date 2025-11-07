"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DashboardInsights from "../components/DashboardInsights";

export default function InsightsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok && data.user) {
          setCurrentUser(data.user);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("User fetch error:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentUser();
  }, [router]);

  if (loading || !currentUser) {
    return (
      <div className="h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-600 text-lg animate-pulse">
        Loading insights...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 text-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              AI Insights
            </h1>
            <p className="text-gray-600">
              Get AI-powered analysis of your dashboard with personalized recommendations based on your role and current work status.
            </p>
          </div>

          {/* User Info */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 mb-8">
            <p className="text-gray-700 text-sm">
              Viewing insights as: <span className="font-semibold text-indigo-700">{currentUser?.name || currentUser?.email}</span>
              <span className="ml-3 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                {currentUser?.role?.replace("_", " ")}
              </span>
            </p>
          </div>

          {/* AI Insights Component */}
          <DashboardInsights currentUser={currentUser} />
        </main>
      </div>
    </div>
  );
}
