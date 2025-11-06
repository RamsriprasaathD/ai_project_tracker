import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

/**
 * GET /api/assignable-users
 * Returns users that the current user can assign projects/tasks to
 * - MANAGER: Returns Team Leads in their organization
 * - TEAM_LEAD: Returns Team Members under them
 * - INDIVIDUAL: Returns empty (can't assign to others)
 * - TEAM_MEMBER: Returns empty (can't assign to others)
 */
export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const user = token ? await getUserFromToken(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let assignableUsers: any[] = [];

    if (user.role === "MANAGER") {
      // Get all Team Leads in manager's organization
      const org = await prisma.organization.findFirst({ where: { managerId: user.id } });
      if (org) {
        assignableUsers = await prisma.user.findMany({
          where: {
            role: "TEAM_LEAD",
            organizationId: org.id,
          },
          select: {
            id: true,
            name: true,
            email: true,
            tlIdWithinOrg: true,
          },
          orderBy: { name: "asc" },
        });
      }
    } else if (user.role === "TEAM_LEAD") {
      // Get all Team Members under this Team Lead
      assignableUsers = await prisma.user.findMany({
        where: {
          role: "TEAM_MEMBER",
          teamLeadId: user.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({ users: assignableUsers });
  } catch (err: any) {
    console.error("❌ /api/assignable-users GET error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
