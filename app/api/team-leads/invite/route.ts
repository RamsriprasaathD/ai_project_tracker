import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function generateSecurePassword(length = 8) {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const randomBytes = crypto.randomBytes(length);
  let password = "";

  for (let i = 0; i < length; i += 1) {
    const index = randomBytes[i] % charset.length;
    password += charset[index];
  }

  return password;
}

function buildInviteEmail(options: {
  organizationName: string;
  managerName: string;
  loginUrl: string;
  email: string;
  password: string;
}) {
  const { organizationName, managerName, loginUrl, email, password } = options;

  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937;">
      <h2 style="color:#2563eb;">You're now a Team Lead at ${organizationName}</h2>
      <p>Hello there,</p>
      <p>${managerName} has invited you to join <strong>${organizationName}</strong> as a Team Lead on the AI Project Tracker platform.</p>
      <p>Use the credentials below to sign in. We recommend changing your password after your first login.</p>
      <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:20px 0;color:#111827;">
        <p style="margin:0;font-weight:600;">Login Email: <span style="font-weight:400;">${email}</span></p>
        <p style="margin:8px 0 0;font-weight:600;">Temporary Password: <span style="font-weight:400;">${password}</span></p>
      </div>
      <p>
        <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">
          Go to Dashboard
        </a>
      </p>
      <p style="margin-top:24px;">If you did not expect this invitation, please reach out to ${managerName}.</p>
      <p style="margin-top:24px;color:#6b7280;font-size:14px;">– The AI Project Tracker Team</p>
    </div>
  `;
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1] || "";
    const manager = token ? await getUserFromToken(token) : null;

    if (!manager || manager.role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const emailInput = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const nameInput = typeof body.name === "string" ? body.name.trim() : undefined;

    if (!emailInput) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const organization = await prisma.organization.findFirst({ where: { managerId: manager.id } });
    if (!organization) {
      return NextResponse.json({ error: "Organization not found for manager" }, { status: 404 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: emailInput } });

    const plainPassword = generateSecurePassword(8);
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    let teamLeadRecord: { id: string; email: string; name: string | null; tlIdWithinOrg: number | null };
    let tlIdWithinOrg: number;
    let isNewTeamLead = false;

    if (existingUser) {
      if (existingUser.organizationId !== organization.id || existingUser.role !== "TEAM_LEAD") {
        return NextResponse.json(
          { error: "This email is already in use. Ask the user to log in or reset their password." },
          { status: 409 }
        );
      }

      const previousHash = existingUser.passwordHash;

      const result = await prisma.$transaction(async (tx) => {
        let nextTlId = existingUser.tlIdWithinOrg;

        if (!nextTlId) {
          const lastTeamLead = await tx.user.findFirst({
            where: { organizationId: organization.id, role: "TEAM_LEAD" },
            orderBy: { tlIdWithinOrg: "desc" },
          });
          nextTlId = lastTeamLead?.tlIdWithinOrg ? lastTeamLead.tlIdWithinOrg + 1 : 1;
        }

        const updatedTeamLead = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            passwordHash,
            tlIdWithinOrg: nextTlId,
            ...(nameInput ? { name: nameInput } : {}),
          },
        });

        return { updatedTeamLead, tlId: nextTlId! };
      });

      teamLeadRecord = result.updatedTeamLead;
      tlIdWithinOrg = result.tlId;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      const loginUrl = appUrl ? `${appUrl.replace(/\/$/, "")}/login` : "";
      const managerName = manager.name || "Your Manager";

      try {
        await sendEmail({
          to: emailInput,
          subject: `You're invited as Team Lead for ${organization.name}`,
          html: buildInviteEmail({
            organizationName: organization.name,
            managerName,
            loginUrl: loginUrl || appUrl || "",
            email: emailInput,
            password: plainPassword,
          }),
        });
      } catch (emailError) {
        await prisma.user.update({ where: { id: existingUser.id }, data: { passwordHash: previousHash } });
        console.error("Team lead reinvite email failed:", emailError);
        return NextResponse.json(
          { error: "Failed to send invite email. Please try again.", details: (emailError as Error).message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Existing team lead password reset and invitation re-sent",
          teamLead: {
            id: teamLeadRecord.id,
            email: teamLeadRecord.email,
            name: teamLeadRecord.name,
            tlIdWithinOrg,
          },
          temporaryPassword: plainPassword,
        },
        { status: 200 }
      );
    }

    isNewTeamLead = true;

    const { createdUser, tlIdWithinOrg: newTlId } = await prisma.$transaction(async (tx) => {
      const lastTeamLead = await tx.user.findFirst({
        where: { organizationId: organization.id, role: "TEAM_LEAD" },
        orderBy: { tlIdWithinOrg: "desc" },
      });

      const nextTlId = lastTeamLead?.tlIdWithinOrg ? lastTeamLead.tlIdWithinOrg + 1 : 1;

      const newTeamLead = await tx.user.create({
        data: {
          email: emailInput,
          passwordHash,
          name: nameInput,
          role: "TEAM_LEAD",
          organizationId: organization.id,
          tlIdWithinOrg: nextTlId,
        },
      });

      return { createdUser: newTeamLead, tlIdWithinOrg: nextTlId };
    });

    teamLeadRecord = createdUser;
    tlIdWithinOrg = newTlId;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const loginUrl = appUrl ? `${appUrl.replace(/\/$/, "")}/login` : "";
    const managerName = manager.name || "Your Manager";

    try {
      await sendEmail({
        to: emailInput,
        subject: `You're invited as Team Lead for ${organization.name}`,
        html: buildInviteEmail({
          organizationName: organization.name,
          managerName,
          loginUrl: loginUrl || appUrl || "",
          email: emailInput,
          password: plainPassword,
        }),
      });
    } catch (emailError) {
      await prisma.user.delete({ where: { id: createdUser.id } });
      console.error("Team lead invite email failed:", emailError);
      return NextResponse.json(
        { error: "Failed to send invite email. Please try again.", details: (emailError as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Team lead invited successfully",
        teamLead: {
          id: teamLeadRecord.id,
          email: teamLeadRecord.email,
          name: teamLeadRecord.name,
          tlIdWithinOrg,
        },
        temporaryPassword: plainPassword,
      },
      { status: isNewTeamLead ? 201 : 200 }
    );
  } catch (error: any) {
    console.error("Team lead invite error:", error);
    return NextResponse.json({ error: "Failed to invite team lead", details: error.message }, { status: 500 });
  }
}
