import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role, organizationName, tlIdWithinOrg, teamLeadId } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password and role are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );

    const passwordHash = await bcrypt.hash(password, 10);

    /* -------------------------------------------------------------------------- */
    /* 🧩 ROLE: MANAGER — Creates organization and becomes its manager             */
    /* -------------------------------------------------------------------------- */
    if (role === "MANAGER") {
      if (!organizationName)
        return NextResponse.json(
          { error: "Organization name is required for Manager role" },
          { status: 400 }
        );

      // Step 1: Create the Manager user
      const manager = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          role,
        },
      });

      // Step 2: Create Organization linked to this manager
      const org = await prisma.organization.create({
        data: {
          name: organizationName,
          managerId: manager.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Manager & organization '${org.name}' created successfully`,
        managerId: manager.id,
      });
    }

    /* -------------------------------------------------------------------------- */
    /* 🧩 ROLE: TEAM_LEAD — Joins existing organization and gets TL ID             */
    /* -------------------------------------------------------------------------- */
    if (role === "TEAM_LEAD") {
      if (!organizationName)
        return NextResponse.json(
          { error: "Organization name is required" },
          { status: 400 }
        );

      const org = await prisma.organization.findUnique({
        where: { name: organizationName },
      });

      if (!org)
        return NextResponse.json(
          {
            error: "Organization not found. Manager must create it first.",
          },
          { status: 400 }
        );

      // Get next TL ID in this organization
      const lastTL = await prisma.user.findFirst({
        where: { organizationId: org.id, role: "TEAM_LEAD" },
        orderBy: { tlIdWithinOrg: "desc" },
      });
      const nextTlId = lastTL ? lastTL.tlIdWithinOrg! + 1 : 1;

      await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          role,
          organizationId: org.id,
          tlIdWithinOrg: nextTlId,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Team Lead joined ${org.name}`,
        tlId: nextTlId,
      });
    }

    /* -------------------------------------------------------------------------- */
    /* 🧩 ROLE: TEAM_MEMBER — Joins existing TL’s team                             */
    /* -------------------------------------------------------------------------- */
    if (role === "TEAM_MEMBER") {
      if (!tlIdWithinOrg)
        return NextResponse.json(
          { error: "Team Lead ID is required for Team Member" },
          { status: 400 }
        );

      const lead = await prisma.user.findFirst({
        where: { tlIdWithinOrg, role: "TEAM_LEAD" },
      });

      if (!lead)
        return NextResponse.json(
          { error: "Team Lead not found in organization" },
          { status: 400 }
        );

      await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          role,
          teamLeadId: lead.id,
          organizationId: lead.organizationId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Team member registered successfully",
      });
    }

    /* -------------------------------------------------------------------------- */
    /* 🧩 ROLE: INDIVIDUAL — Standalone user, no organization                     */
    /* -------------------------------------------------------------------------- */
    if (role === "INDIVIDUAL") {
      await prisma.user.create({
        data: { email, passwordHash, name, role },
      });
      return NextResponse.json({
        success: true,
        message: "Individual registered successfully",
      });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Registration failed", details: error.message },
      { status: 500 }
    );
  }
}
