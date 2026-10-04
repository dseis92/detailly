import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";
import { hasSupabaseConfig } from "@/infrastructure/auth/supabase/server";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{
    next?: string;
    callbackUrl?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const nextPath = params.next ?? params.callbackUrl ?? "";
  const configured = hasSupabaseConfig();
  return (
    <main className="auth-page">
      <div className="auth-card" aria-labelledby="sign-in-title">
        <p className="kicker">Detailly account</p>
        <h1 id="sign-in-title">Your bookings, in one place.</h1>
        <p>
          Sign in with a secure link sent to your email. No password to
          remember.
        </p>
        {configured ? (
          <SignInForm nextPath={nextPath} />
        ) : (
          <p className="auth-message" role="status">
            Email sign-in is not ready yet. Supabase settings must be added to
            this deployment.
          </p>
        )}
        {params.error === "setup" ? (
          <p className="auth-message auth-error" role="alert">
            Account setup is waiting for the database migration and owner
            settings to be configured.
          </p>
        ) : params.error ? (
          <p className="auth-message auth-error" role="alert">
            Sign-in failed. Please request a fresh link.
          </p>
        ) : null}
        <Link className="auth-back-link" href="/">
          Return to booking
        </Link>
      </div>
    </main>
  );
}
