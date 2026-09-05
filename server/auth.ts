import { promisify } from "node:util";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { sdk } from "./_core/sdk";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function authError(message: string): never {
  throw new TRPCError({ code: "UNAUTHORIZED", message });
}

export async function createLocalSession(openId: string, name: string) {
  return sdk.signSession({ openId, appId: "studystride", name });
}
