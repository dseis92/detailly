import { z } from "zod";
import { createSupabaseServerClient } from "@/infrastructure/auth/supabase/server";
import { safeInternalPath } from "@/infrastructure/auth/supabase/redirect";

const requestSchema = z.object({
  email: z.email().trim().max(320),
  name: z.string().trim().max(100).optional().default(""),
  nextPath: z.string().max(500).optional().default("")
});

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request." }, { status: 403 });
  }
  try {
    const input = requestSchema.parse(await request.json());
    const appUrl = process.env.APP_BASE_URL ?? new URL(request.url).origin;
    const callback = new URL("/auth/callback", appUrl);
    const ownerEmail = process.env.DETAILLY_OWNER_EMAIL?.trim().toLowerCase();
    const defaultPath = emailEquals(input.email, ownerEmail)
      ? "/admin"
      : "/account";
    callback.searchParams.set(
      "next",
      safeInternalPath(input.nextPath, defaultPath)
    );
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: input.email.toLowerCase(),
      options: {
        emailRedirectTo: callback.toString(),
        shouldCreateUser: true,
        ...(input.name ? { data: { display_name: input.name } } : {})
      }
    });
    if (error) throw error;
    return Response.json(
      { sent: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }
    return Response.json(
      {
        error: "We could not send the sign-in link. Please try again shortly."
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

function emailEquals(email: string, expected: string | undefined): boolean {
  return Boolean(expected) && email.trim().toLowerCase() === expected;
}
