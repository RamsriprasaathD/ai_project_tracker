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
      className="space-y-6"
    >
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-gray-600 text-sm font-medium mb-2">Full Name</label>
        <input
          type="text"
          name="name"
          required
          onChange={handleChange}
          value={formData.name}
          className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
          placeholder="Enter your full name"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-gray-600 text-sm font-medium mb-2">Email Address</label>
        <input
          type="email"
          name="email"
          required
          onChange={handleChange}
          value={formData.email}
          className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
          placeholder="Enter your email"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-gray-600 text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          name="password"
          required
          onChange={handleChange}
          value={formData.password}
          className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
          placeholder="Create a password"
        />
      </div>

      {/* Role Selection */}
      <div>
        <label className="block text-gray-600 text-sm font-medium mb-2">Select Role</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
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
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-2">
            Organization Name
          </label>
          <input
            type="text"
            name="organizationName"
            required
            value={formData.organizationName}
            onChange={handleChange}
            placeholder="Enter organization name"
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
          />
        </div>
      )}

      {/* ✅ Team Lead Dropdown for Team Members */}
      {formData.role === "TEAM_MEMBER" && (
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-2">
            Select Team Lead (ID & Name)
          </label>
          {fetchingTLs ? (
            <div className="text-gray-500 text-sm p-3 bg-blue-100 rounded-lg">Loading team leads...</div>
          ) : teamLeads.length > 0 ? (
            <select
              name="tlIdWithinOrg"
              required
              value={formData.tlIdWithinOrg}
              onChange={handleChange}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
            >
              <option value="">Select Team Lead</option>
              {teamLeads.map((tl) => (
                <option key={tl.tlIdWithinOrg} value={tl.tlIdWithinOrg}>
                  {tl.tlIdWithinOrg} {tl.name ? `- ${tl.name}` : ""}
                </option>
              ))}
            </select>
          ) : formData.organizationName.trim() !== "" ? (
            <div className="text-red-700 text-sm bg-red-100 p-3 rounded-lg">
              No team leads found for this organization.
            </div>
          ) : null}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Creating Account..." : "Create Account"}
      </button>
    </form>
  );
}
