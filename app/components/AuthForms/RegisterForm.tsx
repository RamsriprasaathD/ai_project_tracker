"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "INDIVIDUAL",
    organizationName: "",
    tlIdWithinOrg: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teamLeads, setTeamLeads] = useState<
    { tlIdWithinOrg: number; name: string | null }[]
  >([]);
  const [fetchingTLs, setFetchingTLs] = useState(false);

  // 🔄 Fetch Team Leads dynamically when Team Member types organization name
  useEffect(() => {
    if (formData.role === "TEAM_MEMBER" && formData.organizationName.trim() !== "") {
      setFetchingTLs(true);
      fetch(`/api/orgs/teamleads?orgName=${encodeURIComponent(formData.organizationName)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setTeamLeads(data.teamLeads || []);
          } else {
            setTeamLeads([]);
          }
          setFetchingTLs(false);
        })
        .catch(() => {
          setTeamLeads([]);
          setFetchingTLs(false);
        });
    } else {
      setTeamLeads([]);
    }
  }, [formData.role, formData.organizationName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          organizationName:
            formData.role === "MANAGER" ||
            formData.role === "TEAM_LEAD" ||
            formData.role === "TEAM_MEMBER"
              ? formData.organizationName
              : undefined,
          tlIdWithinOrg:
            formData.role === "TEAM_MEMBER"
              ? Number(formData.tlIdWithinOrg)
              : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      alert("✅ Registration successful! Please log in.");
      router.push("/login");
    } catch (err: any) {
      console.error("Register error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900/80 border border-gray-800 p-8 rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.15)] backdrop-blur-md max-w-md w-full mx-auto text-white"
    >
      <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text text-center">
        Create Your Account 🚀
      </h2>

      {error && (
        <p className="bg-red-900/40 text-red-400 p-2 rounded-md text-center text-sm mb-4">
          {error}
        </p>
      )}

      {/* Name */}
      <div className="mb-4">
        <label className="block text-sm mb-1 text-gray-300">Full Name</label>
        <input
          type="text"
          name="name"
          required
          onChange={handleChange}
          value={formData.name}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-sm mb-1 text-gray-300">Email</label>
        <input
          type="email"
          name="email"
          required
          onChange={handleChange}
          value={formData.email}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Password */}
      <div className="mb-4">
        <label className="block text-sm mb-1 text-gray-300">Password</label>
        <input
          type="password"
          name="password"
          required
          onChange={handleChange}
          value={formData.password}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Role Selection */}
      <div className="mb-4">
        <label className="block text-sm mb-1 text-gray-300">Select Role</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="INDIVIDUAL">Individual</option>
          <option value="MANAGER">Manager</option>
          <option value="TEAM_LEAD">Team Lead</option>
          <option value="TEAM_MEMBER">Team Member</option>
        </select>
      </div>

      {/* ✅ Organization Name — shown for MANAGER, TEAM_LEAD, TEAM_MEMBER */}
      {(formData.role === "MANAGER" ||
        formData.role === "TEAM_LEAD" ||
        formData.role === "TEAM_MEMBER") && (
        <div className="mb-4">
          <label className="block text-sm mb-1 text-gray-300">
            Organization Name
          </label>
          <input
            type="text"
            name="organizationName"
            required
            value={formData.organizationName}
            onChange={handleChange}
            placeholder="Enter organization name"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      )}

      {/* ✅ Team Lead Dropdown for Team Members */}
      {formData.role === "TEAM_MEMBER" && (
        <div className="mb-4">
          <label className="block text-sm mb-1 text-gray-300">
            Select Team Lead (ID & Name)
          </label>
          {fetchingTLs ? (
            <div className="text-gray-400 text-sm">Loading team leads...</div>
          ) : teamLeads.length > 0 ? (
            <select
              name="tlIdWithinOrg"
              required
              value={formData.tlIdWithinOrg}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Team Lead</option>
              {teamLeads.map((tl) => (
                <option key={tl.tlIdWithinOrg} value={tl.tlIdWithinOrg}>
                  {tl.tlIdWithinOrg} {tl.name ? `- ${tl.name}` : ""}
                </option>
              ))}
            </select>
          ) : formData.organizationName.trim() !== "" ? (
            <div className="text-red-400 text-sm">
              No team leads found for this organization.
            </div>
          ) : null}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 mt-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition duration-200 font-semibold disabled:opacity-50"
      >
        {loading ? "Registering..." : "Register"}
      </button>

      <p className="text-gray-400 text-sm text-center mt-4">
        Already have an account?{" "}
        <span
          onClick={() => router.push("/login")}
          className="text-blue-400 cursor-pointer hover:underline"
        >
          Login here
        </span>
      </p>
    </form>
  );
}
