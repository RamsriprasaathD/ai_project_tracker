import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

/**
 * Verifies JWT token and returns decoded payload (without DB fetch)
 */
export function verifyTokenSync(token?: string) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (err) {
    return null;
  }
}

/**
 * Verifies token and returns full user with organization info
 */
export async function getUserFromToken(token: string) {
  try {
    const payload = verifyTokenSync(token);
    if (!payload?.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { organization: true },
    });

    // fallback: if user is manager but org missing, fetch it
    if (user && !user.organization && user.role === "MANAGER") {
      const org = await prisma.organization.findFirst({ where: { managerId: user.id } });
      if (org) user.organization = org;
    }

    return user;
  } catch (err) {
    console.error("getUserFromToken error:", err);
    return null;
  }
}
