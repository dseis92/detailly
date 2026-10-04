import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getAuthenticatedActors } from "@/infrastructure/auth/supabase/actor";
import { hasSupabaseConfig } from "@/infrastructure/auth/supabase/server";
import { getDatabase } from "@/infrastructure/database/client";
import {
  appointmentItems,
  appointments,
  customers
} from "@/infrastructure/database/schema";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!hasSupabaseConfig()) redirect("/sign-in?next=%2Faccount");
  let actors;
  try {
    actors = await getAuthenticatedActors();
  } catch {
    redirect("/sign-in?next=%2Faccount&error=setup");
  }
  const actor = actors[0];
  if (!actor) redirect("/sign-in?next=%2Faccount");

  const bookings = await getDatabase()
    .select({
      id: appointments.id,
      reference: appointments.publicReference,
      status: appointments.status,
      startsAt: appointments.startsAt,
      timezone: appointments.timezone,
      address: appointments.serviceAddress,
      vehicle: appointments.vehicleDescription,
      totalMinor: appointments.totalMinor,
      depositMinor: appointments.depositMinor
    })
    .from(appointments)
    .innerJoin(customers, eq(customers.id, appointments.customerId))
    .where(
      and(
        eq(appointments.businessId, actor.businessId),
        eq(customers.email, actor.email)
      )
    )
    .orderBy(desc(appointments.createdAt))
    .limit(50);
  const itemRows = bookings.length
    ? await getDatabase()
        .select({
          appointmentId: appointmentItems.appointmentId,
          name: appointmentItems.displayName
        })
        .from(appointmentItems)
        .where(
          inArray(
            appointmentItems.appointmentId,
            bookings.map((item) => item.id)
          )
        )
    : [];
  const itemsByAppointment = new Map<string, string[]>();
  for (const item of itemRows) {
    const names = itemsByAppointment.get(item.appointmentId) ?? [];
    names.push(item.name);
    itemsByAppointment.set(item.appointmentId, names);
  }

  return (
    <main className="admin-page" aria-labelledby="account-title">
      <div className="admin-shell portal-shell">
        <div className="portal-topline">
          <p className="kicker">Detailly / customer portal</p>
          <SignOutButton />
        </div>
        <h1 id="account-title">Hi, {actor.displayName}.</h1>
        <p>Your saved booking requests and appointments are here.</p>
        <section
          className="portal-bookings"
          aria-labelledby="your-bookings-title"
        >
          <h2 id="your-bookings-title">Your bookings</h2>
          {bookings.length ? (
            <div className="portal-booking-list">
              {bookings.map((booking) => (
                <article
                  className="portal-booking-card"
                  key={booking.reference}
                >
                  <div className="portal-card-heading">
                    <strong>{booking.reference}</strong>
                    <span className="request-status">
                      {booking.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p>
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: booking.timezone
                    }).format(booking.startsAt)}
                  </p>
                  <p>
                    {booking.vehicle} · {booking.address}
                  </p>
                  <p>
                    {(itemsByAppointment.get(booking.id) ?? []).join(" · ")}
                  </p>
                  <p>
                    ${(booking.totalMinor / 100).toFixed(2)} estimate · $
                    {(booking.depositMinor / 100).toFixed(2)} deposit required
                  </p>
                  {booking.status === "request_received" && (
                    <p className="portal-note">
                      This is a request, not a confirmed appointment. No payment
                      has been collected.
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="portal-empty">
              No bookings are linked to this account yet. Verified requests made
              with this email will appear here.
            </p>
          )}
        </section>
        <Link className="primary-action" href="/">
          Start a booking <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
