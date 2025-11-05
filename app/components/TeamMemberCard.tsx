"use client";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function TeamMemberCard({ member }: { member: Member }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center space-x-4 shadow hover:shadow-blue-600/10 transition">
      <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-semibold">
        {member.name ? member.name.charAt(0).toUpperCase() : "?"}
      </div>

      <div className="flex-1">
        <p className="font-semibold text-white">{member.name}</p>
        <p className="text-sm text-gray-400">{member.email}</p>
      </div>

      <span
        className={`px-3 py-1 text-xs rounded-full ${
          member.role === "TEAM_LEAD"
            ? "bg-purple-700 text-white"
            : member.role === "MANAGER"
            ? "bg-green-700 text-white"
            : "bg-gray-700 text-gray-300"
        }`}
      >
        {member.role.replace("_", " ")}
      </span>
    </div>
  );
}
