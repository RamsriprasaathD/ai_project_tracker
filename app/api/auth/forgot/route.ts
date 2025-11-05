import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email)
      return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });

    // ✅ Do not reveal if user exists (security best practice)
    if (!user)
      return NextResponse.json({
        success: true,
        message: "Password reset link sent (if account exists)",
      });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    // ✅ Remove old tokens for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    // ✅ Create new token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset?token=${token}`;

    // ✅ Send styled email
    await sendEmail({
      to: email,
      subject: "Password Reset - AI Project Tracker",
      html: `
        <div style="font-family:Arial,sans-serif;color:#333;">
          <h2>Hello ${user.name || "there"},</h2>
          <p>You requested to reset your password for <b>AI Project Tracker</b>.</p>
          <p>
            <a href="${resetLink}" 
              style="display:inline-block;background:#2563eb;color:#fff;
              padding:10px 20px;border-radius:6px;text-decoration:none;">
              Reset Password
            </a>
          </p>
          <p>If the button doesn’t work, copy and paste this link in your browser:</p>
          <p style="word-break:break-all;">${resetLink}</p>
          <p>This link will expire in <strong>30 minutes</strong>.</p>
          <p>If you didn’t request this, you can safely ignore this email.</p>
          <br/>
          <p>– The AI Project Tracker Team</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Password reset link sent",
    });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: "Failed to send reset email", details: error.message },
      { status: 500 }
    );
  }
}
