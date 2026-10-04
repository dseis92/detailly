import { createSupabaseServerClient } from "@/infrastructure/auth/supabase/server";

export async function POST(): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // The response remains idempotent if Supabase has already expired the session.
  }
  return Response.json(
    { signedOut: true },
    { headers: { "Cache-Control": "no-store" } }
  );
}
