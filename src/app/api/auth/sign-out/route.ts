import { cookies } from "next/headers";
import { revokeSession } from "@/modules/identity-access/session";
import { SESSION_COOKIE_NAME } from "@/modules/identity-access/session-token";

export async function POST(): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) await revokeSession(token);
  cookieStore.delete(SESSION_COOKIE_NAME);
  return Response.json({ signedOut: true });
}
