import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const teamLeadId = url.searchParams.get("teamLeadId");
    const full = url.searchParams.get("full") === "true";

    if (teamLeadId) {
      // Fetch all team members for this TL
      const teamMembers = await prisma.user.findMany({
        where: { teamLeadId },
        select: { id: true, name: true, email: true },
      });
      return NextResponse.json({ teamMembers });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded)
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const userId = (decoded as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        projectsOwned: full,
        tasksAssigned: full ? { include: { project: true } } : false,
      },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    console.error("User route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
