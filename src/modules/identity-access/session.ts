import { and, eq, gt, isNull } from "drizzle-orm";
import { getDatabase } from "@/infrastructure/database/client";
import {
  businessMemberships,
  sessions,
  users
} from "@/infrastructure/database/schema";
import { Actor, Role } from "./policy";
import {
  createSessionToken,
  hashSessionToken,
  sessionExpiry
} from "./session-token";

export async function createSession(
  userId: string,
  now = new Date()
): Promise<{ token: string; expiresAt: Date }> {
  const token = createSessionToken();
  const expiresAt = sessionExpiry(now);
  await getDatabase()
    .insert(sessions)
    .values({
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
      lastRotatedAt: now,
      createdAt: now
    });
  return { token, expiresAt };
}

export async function rotateSession(
  token: string,
  now = new Date()
): Promise<{ token: string; expiresAt: Date } | null> {
  const current = await getDatabase()
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenHash, hashSessionToken(token)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now)
      )
    )
    .limit(1);
  const row = current[0];
  if (!row) return null;
  const nextToken = createSessionToken();
  const expiresAt = sessionExpiry(now);
  await getDatabase()
    .update(sessions)
    .set({
      tokenHash: hashSessionToken(nextToken),
      expiresAt,
      lastRotatedAt: now
    })
    .where(eq(sessions.id, row.id));
  return { token: nextToken, expiresAt };
}

export async function revokeSession(token: string): Promise<void> {
  await getDatabase()
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.tokenHash, hashSessionToken(token)));
}

export async function findSessionActors(
  token: string,
  now = new Date()
): Promise<Actor[]> {
  const rows = await getDatabase()
    .select({
      userId: users.id,
      businessId: businessMemberships.businessId,
      role: businessMemberships.role,
      displayName: users.displayName,
      email: users.email
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .innerJoin(businessMemberships, eq(businessMemberships.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashSessionToken(token)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
        eq(users.status, "active")
      )
    );
  return rows as Actor[];
}

export function roleFromDatabase(value: string): Role {
  if (
    value === "customer" ||
    value === "staff" ||
    value === "manager" ||
    value === "owner"
  )
    return value;
  throw new Error("Unknown membership role");
}
