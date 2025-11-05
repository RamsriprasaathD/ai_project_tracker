import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/orgs/teamleads?orgName=CompanyX
 * Returns a list of team leads (id + name) for the given organization.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgName = searchParams.get("orgName");

    if (!orgName) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    // Find the organization
    const organization = await prisma.organization.findUnique({
      where: { name: orgName },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found", teamLeads: [] },
        { status: 404 }
      );
    }

    // Fetch all team leads for that organization
    const teamLeads = await prisma.user.findMany({
      where: {
        organizationId: organization.id,
        role: "TEAM_LEAD",
      },
      select: {
        tlIdWithinOrg: true,
        name: true,
      },
      orderBy: {
        tlIdWithinOrg: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      organization: orgName,
      teamLeads,
    });
  } catch (error: any) {
    console.error("❌ Team Lead Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch team leads", teamLeads: [] },
      { status: 500 }
    );
  }
}
