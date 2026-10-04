import { desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { OwnerPortal } from "@/components/admin/owner-portal";
import { getAuthenticatedActors } from "@/infrastructure/auth/supabase/actor";
import { hasSupabaseConfig } from "@/infrastructure/auth/supabase/server";
import { getDatabase } from "@/infrastructure/database/client";
import {
  appointmentItems,
  appointments,
  customers
} from "@/infrastructure/database/schema";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!hasSupabaseConfig()) redirect("/sign-in?next=%2Fadmin");
  let actor;
  try {
    actor = (await getAuthenticatedActors()).find(
      (candidate) => candidate.role === "owner"
    );
  } catch {
    redirect("/sign-in?next=%2Fadmin&error=setup");
  }
  if (!actor) redirect("/account");

  const db = getDatabase();
  const [bookingRows, customerRows] = await Promise.all([
    db
      .select({
        id: appointments.id,
        customerId: appointments.customerId,
        reference: appointments.publicReference,
        status: appointments.status,
        startsAt: appointments.startsAt,
        serviceEndsAt: appointments.serviceEndsAt,
        createdAt: appointments.createdAt,
        timezone: appointments.timezone,
        address: appointments.serviceAddress,
        customerAddress: appointments.customerAddress,
        vehicle: appointments.vehicleDescription,
        vehicleCategory: appointments.vehicleCategory,
        waterAvailable: appointments.waterAvailable,
        electricityAvailable: appointments.electricityAvailable,
        conditionNotes: appointments.conditionNotes,
        accessNotes: appointments.accessNotes,
        referralSource: appointments.referralSource,
        subtotalMinor: appointments.subtotalMinor,
        discountMinor: appointments.discountMinor,
        taxMinor: appointments.taxMinor,
        totalMinor: appointments.totalMinor,
        depositMinor: appointments.depositMinor,
        currency: appointments.currency,
        customerName: customers.displayName,
        email: customers.email,
        phone: customers.phone
      })
      .from(appointments)
      .innerJoin(customers, eq(customers.id, appointments.customerId))
      .where(eq(appointments.businessId, actor.businessId))
      .orderBy(desc(appointments.createdAt)),
    db
      .select({
        id: customers.id,
        name: customers.displayName,
        email: customers.email,
        phone: customers.phone,
        createdAt: customers.createdAt
      })
      .from(customers)
      .where(eq(customers.businessId, actor.businessId))
      .orderBy(desc(customers.createdAt))
  ]);

  const itemRows = bookingRows.length
    ? await db
        .select({
          appointmentId: appointmentItems.appointmentId,
          name: appointmentItems.displayName
        })
        .from(appointmentItems)
        .where(
          inArray(
            appointmentItems.appointmentId,
            bookingRows.map((booking) => booking.id)
          )
        )
        .orderBy(appointmentItems.sortOrder)
    : [];
  const itemsByAppointment = new Map<string, string[]>();
  for (const item of itemRows) {
    const names = itemsByAppointment.get(item.appointmentId) ?? [];
    names.push(item.name);
    itemsByAppointment.set(item.appointmentId, names);
  }

  return (
    <OwnerPortal
      ownerName={actor.displayName}
      bookings={bookingRows.map((booking) => ({
        ...booking,
        startsAt: booking.startsAt.toISOString(),
        serviceEndsAt: booking.serviceEndsAt.toISOString(),
        createdAt: booking.createdAt.toISOString(),
        services: itemsByAppointment.get(booking.id) ?? []
      }))}
      customers={customerRows.map((customer) => ({
        ...customer,
        createdAt: customer.createdAt.toISOString()
      }))}
    />
  );
}
