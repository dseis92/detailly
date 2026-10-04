import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/infrastructure/database/client";
import { businessMemberships, users } from "@/infrastructure/database/schema";
import { createSupabaseServerClient } from "./server";
import type { Actor } from "@/modules/identity-access/policy";

export async function getAuthenticatedActors(): Promise<Actor[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email_confirmed_at) return [];

  const rows = await getDatabase()
    .select({
      userId: users.id,
      businessId: businessMemberships.businessId,
      role: businessMemberships.role,
      displayName: users.displayName,
      email: users.email
    })
    .from(users)
    .innerJoin(businessMemberships, eq(businessMemberships.userId, users.id))
    .where(and(eq(users.id, data.user.id), eq(users.status, "active")));
  return rows as Actor[];
}
