import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/modules/identity-access/session-token";
import { findSessionActors } from "@/modules/identity-access/session";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return Response.json({ authenticated: false }, { status: 401 });
  const actors = await findSessionActors(token);
  if (actors.length === 0)
    return Response.json({ authenticated: false }, { status: 401 });
  return Response.json({ authenticated: true, actors });
}
