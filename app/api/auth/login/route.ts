import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";

/**
 * POST /api/auth/login
 * Authenticates a user, validates credentials, and returns a JWT cookie.
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 🧩 Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // 🔍 Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // 🔐 Compare password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // 🧠 JWT payload
    const payload: object = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    // 🗝️ JWT secret and options
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not defined in .env");

    const secret = process.env.JWT_SECRET as string;
    const expiresInEnv = process.env.JWT_EXPIRES_IN;
    const expiresIn = expiresInEnv ? String(expiresInEnv) : "7d";
    const options: SignOptions = { expiresIn: expiresIn as unknown as SignOptions['expiresIn'] };

    // 🧾 Generate JWT
    const token = jwt.sign(payload, secret, options);

    // Return token and user info in response
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      role: user.role,
      token: token,
      userId: user.id,
      organizationId: user.organizationId
    });

    // Set cookie using the correct property
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    console.log(`✅ User logged in: ${user.email} (${user.role})`);

    return response;
  } catch (error: any) {
    console.error("❌ Login Error:", error);
    return NextResponse.json({ error: "Login failed. Please try again later." }, { status: 500 });
  }
}
