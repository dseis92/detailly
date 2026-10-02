import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE_NAME = "detailly_session";
export const SESSION_DURATION_DAYS = 7;

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function sessionExpiry(now = new Date()): Date {
  return new Date(now.getTime() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

export function isSessionActive(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() > now.getTime();
}
