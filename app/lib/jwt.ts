// ramsriprasaath's CODE — JWT Utility for AI Project Tracker

import jwt, { SignOptions } from "jsonwebtoken";

// Lazy load JWT_SECRET to avoid build-time errors
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("❌ JWT_SECRET is not defined in environment variables!");
  }
  return secret;
}

/**
 * Signs a JWT token for a user.
 * @param payload - Data to embed (like user ID, email, role)
 * @param expiresIn - Token expiration (default 7 days)
 * @returns Signed JWT token
 */
export function signToken(
  payload: Record<string, any>,
  expiresIn: SignOptions["expiresIn"] = "7d"
): string {
  try {
    const JWT_SECRET = getJwtSecret();
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  } catch (error) {
    console.error("Error signing JWT:", error);
    throw new Error("Failed to sign token");
  }
}

/**
 * Verifies a JWT token.
 * @param token - JWT string
 * @returns Decoded payload if valid, or null if invalid/expired
 */
export function verifyToken(token: string): Record<string, any> | null {
  try {
    const JWT_SECRET = getJwtSecret();
    return jwt.verify(token, JWT_SECRET) as Record<string, any>;
  } catch (error) {
    console.warn("⚠️ Invalid or expired JWT:", (error as Error).message);
    return null;
  }
}

/**
 * Decodes a token without verifying (use only for debugging or optional reads)
 */
export function decodeToken(token: string): Record<string, any> | null {
  try {
    return jwt.decode(token) as Record<string, any>;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}
