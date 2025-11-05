import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/orgs/by-manager?managerId=xyz
 * Returns organization details + team leads under that manager
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get("managerId");

    // 🧩 Validation
    if (!managerId) {
      return NextResponse.json(
        { success: false, error: "managerId is required" },
        { status: 400 }
      );
    }

    // 🧩 Find organization managed by this manager
    const organization = await prisma.organization.findFirst({
      where: { managerId },
      include: {
        users: {
          where: { role: "TEAM_LEAD" },
          select: { id: true, name: true, tlIdWithinOrg: true },
        },
      },
    });

    // 🧩 Handle not found
    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          organization: null,
          message: "No organization found for this manager.",
        },
        { status: 200 }
      );
    }

    // ✅ Return organization data with team leads
    return NextResponse.json({ success: true, organization }, { status: 200 });
  } catch (err: any) {
    console.error("❌ /api/orgs/by-manager error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
