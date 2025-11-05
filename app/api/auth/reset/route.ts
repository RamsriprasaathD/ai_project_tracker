import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password)
      return NextResponse.json({ error: "Token and new password required" }, { status: 400 });

    const resetRecord = await prisma.passwordReset.findUnique({ where: { token } });
    if (!resetRecord)
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });

    if (resetRecord.used || new Date() > resetRecord.expiresAt)
      return NextResponse.json({ error: "Token expired or already used" }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    });

    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    return NextResponse.json({ success: true, message: "Password reset successful" });
  } catch (error: any) {
    console.error("Password Reset Error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
