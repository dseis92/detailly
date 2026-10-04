import { and, eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { getDatabase } from "@/infrastructure/database/client";
import {
  businessMemberships,
  businesses,
  customers,
  users
} from "@/infrastructure/database/schema";

export async function syncSupabaseIdentity(user: User): Promise<void> {
  if (!user.email || !user.email_confirmed_at) {
    throw new Error("A verified email address is required.");
  }
  const emailConfirmedAt = user.email_confirmed_at;
  const email = user.email.trim().toLowerCase();
  const name =
    (typeof user.user_metadata.display_name === "string" &&
      user.user_metadata.display_name.trim()) ||
    email;
  const ownerEmail = process.env.DETAILLY_OWNER_EMAIL?.trim().toLowerCase();
  const db = getDatabase();

  await db.transaction(async (tx) => {
    const [business] = await tx
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.slug, "detailly"))
      .limit(1);
    if (!business)
      throw new Error("The Detailly business record is not configured.");

    await tx
      .insert(users)
      .values({
        id: user.id,
        email,
        displayName: name,
        emailVerifiedAt: new Date(emailConfirmedAt),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email,
          displayName: name,
          emailVerifiedAt: new Date(emailConfirmedAt),
          updatedAt: new Date()
        }
      });

    const isOwner = Boolean(ownerEmail) && email === ownerEmail;
    await tx
      .insert(businessMemberships)
      .values({
        businessId: business.id,
        userId: user.id,
        role: isOwner ? "owner" : "customer"
      })
      .onConflictDoNothing();
    if (isOwner) {
      await tx
        .update(businessMemberships)
        .set({ role: "owner", updatedAt: new Date() })
        .where(
          and(
            eq(businessMemberships.businessId, business.id),
            eq(businessMemberships.userId, user.id)
          )
        );
    }

    const [existingCustomer] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.businessId, business.id),
          eq(customers.userId, user.id)
        )
      )
      .limit(1);
    if (existingCustomer) {
      await tx
        .update(customers)
        .set({ displayName: name, email, updatedAt: new Date() })
        .where(eq(customers.id, existingCustomer.id));
    } else {
      await tx.insert(customers).values({
        businessId: business.id,
        userId: user.id,
        displayName: name,
        email
      });
    }
  });
}
