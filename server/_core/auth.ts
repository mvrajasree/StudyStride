import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

/**
 * Hash a password using scrypt with a unique random salt.
 * Formats output as: salt:derivedKeyHex
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verify a plain text password against a stored salt:derivedKeyHex string.
 * Uses timingSafeEqual to guard against timing attacks.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 2) return false;

    const [salt, keyHex] = parts;
    const keyBuffer = Buffer.from(keyHex, "hex");
    const derivedKey = scryptSync(password, salt, KEY_LENGTH);

    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}
