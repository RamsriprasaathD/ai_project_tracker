// ramsriprasaath's CODE — Password Hashing Utility for AI Project Tracker

import bcrypt from "bcryptjs";

/**
 * Hashes a plain-text password for secure storage
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Verifies whether a given password matches the stored hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
