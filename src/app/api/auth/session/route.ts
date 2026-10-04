import { getAuthenticatedActors } from "@/infrastructure/auth/supabase/actor";
import type { Actor } from "@/modules/identity-access/policy";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  let actors: Actor[];
  try {
    actors = await getAuthenticatedActors();
  } catch {
    actors = [];
  }
  if (actors.length === 0)
    return Response.json({ authenticated: false }, { status: 401 });
  return Response.json({ authenticated: true, actors });
}
