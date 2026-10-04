import { NextResponse, type NextRequest } from "next/server";
import { syncSupabaseIdentity } from "@/infrastructure/auth/supabase/identity";
import { createSupabaseServerClient } from "@/infrastructure/auth/supabase/server";
import { safeInternalPath } from "@/infrastructure/auth/supabase/redirect";

export async function GET(request: NextRequest): Promise<Response> {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=link", request.url));
  }
  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL("/sign-in?error=link", request.url));
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/sign-in?error=link", request.url));
  }
  try {
    await syncSupabaseIdentity(data.user);
  } catch {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/sign-in?error=setup", request.url));
  }

  const ownerEmail = process.env.DETAILLY_OWNER_EMAIL?.trim().toLowerCase();
  const defaultPath =
    data.user.email?.toLowerCase() === ownerEmail ? "/admin" : "/account";
  return NextResponse.redirect(
    new URL(
      safeInternalPath(request.nextUrl.searchParams.get("next"), defaultPath),
      request.url
    )
  );
}
