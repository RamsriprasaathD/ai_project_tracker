"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ProjectTable from "../components/ProjectTable";
import InsightsPanel from "../components/InsightsPanel";
import { ITask, IUser } from "../types/types";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [teamLeads, setTeamLeads] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchUserAndData() {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMsg("Session expired. Please log in again.");
        setTimeout(() => router.push("/login"), 1500);
        return;
      }

      try {
        // 🔹 Fetch user data
        const res = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invalid token");
        const userData = data.user;
        setUser(userData);

        // 🧩 Manager: Get organization + TLs
        if (userData.role === "MANAGER") {
          const orgRes = await fetch(`/api/orgs/by-manager?managerId=${userData.id}`);
          let orgData = null;
          try {
            orgData = await orgRes.json();
          } catch {
            console.warn("⚠️ Could not parse /api/orgs/by-manager response (empty or invalid)");
          }

          if (orgData?.success && orgData.organization) {
            const org = orgData.organization;
            userData.organization = org;
            setUser({ ...userData });

            // Fetch team leads in this organization
            const tlRes = await fetch(`/api/orgs/teamleads?orgName=${encodeURIComponent(org.name)}`);
            const tlData = await tlRes.json();
            setTeamLeads(tlData.teamLeads || []);

            // Fetch all org users
            const usersRes = await fetch(`/api/users?orgName=${encodeURIComponent(org.name)}`);
            const usersData = await usersRes.json();
            setAllUsers(usersData.users || []);
          }
        }

        // 🧩 Team Lead: Get team members + tasks
        if (userData.role === "TEAM_LEAD") {
          const tmRes = await fetch(`/api/users?teamLeadId=${userData.id}`);
          const tmData = await tmRes.json();
          setTeamMembers(tmData.teamMembers || []);
          setAllUsers(tmData.teamMembers || []);

          const taskRes = await fetch("/api/tasks", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const taskData = await taskRes.json();
          setTasks(taskData.tasks || []);
        }

        // 🧩 Manager or TL: Load their tasks
        if (["MANAGER", "TEAM_LEAD"].includes(userData.role)) {
          const taskRes = await fetch("/api/tasks", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const taskData = await taskRes.json();
          setTasks(taskData.tasks || []);
        }
      } catch (err: any) {
        console.error("❌ Dashboard fetch error:", err.message);
        setErrorMsg("Invalid or expired session. Redirecting...");
        localStorage.removeItem("token");
        setTimeout(() => router.push("/login"), 1500);
      } finally {
        setLoading(false);
      }
    }

    fetchUserAndData();
  }, [router]);

  if (loading)
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-400 text-lg">
        <div className="flex gap-2 mb-4">
          <span className="w-3 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" />
        </div>
        Loading your dashboard...
      </div>
    );

  if (!user)
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-gray-950 text-red-400">
        <p className="text-lg font-semibold mb-2">{errorMsg}</p>
        <p className="text-gray-500 text-sm">Redirecting to login...</p>
      </div>
    );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="p-6 overflow-y-auto space-y-8 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <section className="bg-gradient-to-r from-blue-900/80 via-gray-900/90 to-purple-900/80 border border-blue-800/40 p-8 rounded-3xl shadow-2xl mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold mb-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">
                Welcome, {user.name || "User"} 👋
              </h1>
              <p className="text-gray-300 text-lg">
                <span className="font-semibold text-blue-300">{user.role}</span>
                {user.organization ? (
                  <>
                    {" | Organization: "}
                    <span className="text-cyan-300 font-semibold">
                      {user.organization.name}
                    </span>
                  </>
                ) : (
                  <>
                    {" | "}
                    <span className="text-gray-400">No Organization</span>
                  </>
                )}
                {user.role === "TEAM_LEAD" && user.tlIdWithinOrg && (
                  <>
                    {" | "}
                    <span className="text-green-300 font-semibold">
                      TL ID: {user.tlIdWithinOrg}
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="w-full md:w-auto flex-shrink-0">
              <div className="rounded-2xl bg-gradient-to-br from-blue-700/60 to-purple-700/60 p-4 shadow-xl flex flex-col items-center">
                <span className="text-5xl">🚀</span>
                <span className="text-xs text-gray-200 mt-2">AI Project Tracker</span>
              </div>
            </div>
          </section>

          {/* AI Insights Panel */}
          <div className="lg:absolute right-8 top-8 w-full max-w-xs lg:max-w-sm z-10">
            <InsightsPanel projectId={selectedProjectId} />
          </div>

          {/* Manager Section */}
          {user.role === "MANAGER" && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProjectTable tasks={tasks} users={allUsers} canAssign={true} />
              <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 shadow-md backdrop-blur-xl">
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">
                  Team Leaders 👥
                </h2>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {teamLeads.length > 0 ? (
                    teamLeads.map((tl) => (
                      <div
                        key={tl.tlIdWithinOrg}
                        className="bg-gray-800 p-3 rounded-lg flex flex-col mb-2"
                      >
                        <span className="font-semibold text-blue-300">
                          {tl.name || "Unnamed TL"}
                        </span>
                        <span className="text-xs text-gray-400">
                          TL ID: {tl.tlIdWithinOrg}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No team leaders found.</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Team Lead Section */}
          {user.role === "TEAM_LEAD" && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProjectTable tasks={tasks} users={allUsers} canAssign={true} />
              <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 shadow-md backdrop-blur-xl">
                <h2 className="text-xl font-semibold mb-4 text-green-400">
                  Your Team Members 👥
                </h2>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {teamMembers.length > 0 ? (
                    teamMembers.map((tm) => (
                      <div key={tm.id} className="bg-gray-800 p-3 rounded-lg flex flex-col mb-2">
                        <span className="font-semibold text-green-300">{tm.name || tm.email}</span>
                        <span className="text-xs text-gray-400">{tm.email}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No team members found.</p>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
