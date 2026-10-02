import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <div className="auth-card" aria-labelledby="sign-in-title">
        <p className="kicker">Detailly account</p>
        <h1 id="sign-in-title">Your bookings, in one place.</h1>
        <p>
          Email sign-in is being connected to the approved authentication
          provider. Guest checkout remains available for bookings.
        </p>
        <Link className="primary-action" href="/">
          Return home <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
