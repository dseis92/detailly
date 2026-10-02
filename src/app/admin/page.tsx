import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/modules/identity-access/session-token";
import { findSessionActors } from "@/modules/identity-access/session";
import { can } from "@/modules/identity-access/policy";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const actor = token
    ? (await findSessionActors(token)).find((candidate) =>
        can(candidate, "view_operations", candidate.businessId)
      )
    : undefined;
  if (!actor) redirect("/sign-in?callbackUrl=%2Fadmin");
  return (
    <main className="admin-page" aria-labelledby="admin-title">
      <div className="admin-shell">
        <p className="kicker">Operations / foundation</p>
        <h1 id="admin-title">Good morning, {actor.displayName}.</h1>
        <p>
          This protected workspace is ready for business configuration,
          locations, and service operations.
        </p>
        <div className="admin-status" role="status">
          <span aria-hidden="true">●</span> Signed in as {actor.role}
        </div>
      </div>
    </main>
  );
}
