import {
  getDatabase,
  closeDatabase
} from "../src/infrastructure/database/client";
import {
  businesses,
  businessMemberships,
  users
} from "../src/infrastructure/database/schema";
import {
  createSession,
  findSessionActors,
  revokeSession,
  rotateSession
} from "../src/modules/identity-access/session";

async function main(): Promise<void> {
  const db = getDatabase();
  const suffix = crypto.randomUUID();
  const [business] = await db
    .insert(businesses)
    .values({
      displayName: "Identity Check",
      slug: `identity-check-${suffix}`,
      defaultTimezone: "America/Chicago"
    })
    .returning({ id: businesses.id });
  const [user] = await db
    .insert(users)
    .values({
      email: `${suffix}@example.test`,
      displayName: "Identity Check User",
      emailVerifiedAt: new Date()
    })
    .returning({ id: users.id });
  if (!business || !user)
    throw new Error("Could not create identity fixtures.");
  await db
    .insert(businessMemberships)
    .values({ businessId: business.id, userId: user.id, role: "owner" });

  const first = await createSession(user.id);
  if ((await findSessionActors(first.token)).length !== 1)
    throw new Error("Initial session lookup failed.");
  const rotated = await rotateSession(first.token);
  if (!rotated || (await findSessionActors(first.token)).length !== 0)
    throw new Error("Session rotation did not invalidate the old token.");
  if ((await findSessionActors(rotated.token)).length !== 1)
    throw new Error("Rotated session lookup failed.");
  await revokeSession(rotated.token);
  if ((await findSessionActors(rotated.token)).length !== 0)
    throw new Error("Session revocation failed.");

  await closeDatabase();
  console.info(
    "Identity session create, lookup, rotation, and revocation passed."
  );
}

main().catch(async (error: unknown) => {
  console.error(error);
  await closeDatabase();
  process.exitCode = 1;
});
