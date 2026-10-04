import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "@/infrastructure/database/client";
import {
  appointmentItems,
  appointments,
  businesses,
  customers
} from "@/infrastructure/database/schema";
import { getAuthenticatedActors } from "@/infrastructure/auth/supabase/actor";
import { hasSupabaseConfig } from "@/infrastructure/auth/supabase/server";
import {
  catalogPackages,
  vehicleCategories
} from "@/modules/catalog-pricing/catalog";
import { calculateQuote } from "@/modules/catalog-pricing/quote";
import {
  localDateTimeToUtc,
  searchAvailableSlots
} from "@/modules/availability/slots";
import {
  bookingPolicy,
  operatingWindows
} from "@/modules/business-config/booking-policy";

const schema = z.object({
  idempotencyKey: z.uuid(),
  address: z.string().trim().min(8).max(500),
  customerAddress: z.string().trim().min(8).max(500),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.email().trim().max(320),
  phone: z.string().trim().min(7).max(30),
  referral: z.string().trim().min(1).max(100),
  vehicle: z.string().trim().min(2).max(200),
  vehicleCategory: z.enum(vehicleCategories),
  packageIds: z.array(z.string().min(1).max(100)).min(1).max(12),
  startsAt: z.iso.datetime(),
  waterAvailable: z.boolean(),
  electricityAvailable: z.boolean(),
  conditionNotes: z.string().max(4000).default(""),
  accessNotes: z.string().max(4000).default("")
});

function asLocalDateTime(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function publicReference(): string {
  return `DTL-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
}

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request." }, { status: 403 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) {
    return Response.json(
      { error: "The request is too large." },
      { status: 413 }
    );
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Check your booking details and try again." },
      { status: 400 }
    );
  }
  const input = parsed.data;
  const email = input.email.toLowerCase();
  const displayName = `${input.firstName} ${input.lastName}`.trim();
  const packages = input.packageIds.map((id) =>
    catalogPackages.find((item) => item.id === id)
  );
  if (
    packages.some(
      (item) => !item || item.vehicleCategory !== input.vehicleCategory
    )
  ) {
    return Response.json(
      { error: "Choose services for the selected vehicle size." },
      { status: 400 }
    );
  }
  if (
    input.electricityAvailable === false ||
    (input.waterAvailable === false &&
      packages.some((item) => item?.group !== "interior-detail"))
  ) {
    return Response.json(
      { error: "The selected services require the listed site utilities." },
      { status: 400 }
    );
  }

  const quote = calculateQuote(input.packageIds);
  const requestedStart = new Date(input.startsAt);
  if (Number.isNaN(requestedStart.getTime())) {
    return Response.json(
      { error: "Choose an available appointment time." },
      { status: 400 }
    );
  }
  const localStart = asLocalDateTime(requestedStart, bookingPolicy.timezone);
  const canonicalStart = localDateTimeToUtc(localStart, bookingPolicy.timezone);
  const date = localStart.slice(0, 10);
  const rangeStart = localDateTimeToUtc(
    `${date}T${bookingPolicy.opensAt.slice(0, 5)}`,
    bookingPolicy.timezone
  );
  const rangeEnd = localDateTimeToUtc(
    `${date}T${bookingPolicy.closesAt.slice(0, 5)}`,
    bookingPolicy.timezone
  );
  if (
    !canonicalStart ||
    !rangeStart ||
    !rangeEnd ||
    canonicalStart.getTime() !== requestedStart.getTime()
  ) {
    return Response.json(
      { error: "Choose an available appointment time." },
      { status: 400 }
    );
  }
  const available = searchAvailableSlots({
    rangeStart,
    rangeEnd,
    durationMinutes: quote.durationMinutes,
    postServiceBufferMinutes: bookingPolicy.postServiceBufferMinutes,
    windows: operatingWindows,
    now: new Date()
  }).find((slot) => slot.startsAt.getTime() === canonicalStart.getTime());
  if (!available) {
    return Response.json(
      { error: "That time is no longer available. Choose another time." },
      { status: 409 }
    );
  }

  let authUser: { id: string } | null = null;
  if (hasSupabaseConfig()) {
    try {
      const actors = await getAuthenticatedActors();
      const matchingActor = actors.find(
        (actor) => actor.email.toLowerCase() === email
      );
      if (matchingActor) authUser = { id: matchingActor.userId };
    } catch {
      // Guest requests are still allowed if account services are temporarily unavailable.
    }
  }

  const db = getDatabase();
  try {
    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.slug, "detailly"))
      .limit(1);
    if (!business) throw new Error("Booking storage is not initialized.");

    const [prior] = await db
      .select({
        reference: appointments.publicReference,
        email: customers.email
      })
      .from(appointments)
      .innerJoin(customers, eq(customers.id, appointments.customerId))
      .where(
        and(
          eq(appointments.businessId, business.id),
          eq(appointments.idempotencyKey, input.idempotencyKey)
        )
      )
      .limit(1);
    if (prior) {
      if (prior.email !== email)
        return Response.json(
          { error: "This request could not be completed." },
          { status: 409 }
        );
      return Response.json(
        { reference: prior.reference, status: "request_received" },
        { status: 200 }
      );
    }

    const reference = publicReference();
    await db.transaction(async (tx) => {
      let customerId: string | undefined;
      if (authUser) {
        const [existing] = await tx
          .select({ id: customers.id })
          .from(customers)
          .where(
            and(
              eq(customers.businessId, business.id),
              eq(customers.userId, authUser.id)
            )
          )
          .limit(1);
        if (existing) {
          customerId = existing.id;
          await tx
            .update(customers)
            .set({
              displayName,
              email,
              phone: input.phone,
              updatedAt: new Date()
            })
            .where(eq(customers.id, customerId));
        }
      }
      if (!customerId) {
        const [created] = await tx
          .insert(customers)
          .values({
            businessId: business.id,
            userId: authUser?.id,
            displayName,
            email,
            phone: input.phone
          })
          .onConflictDoUpdate({
            target: [customers.businessId, customers.userId],
            set: {
              displayName,
              email,
              phone: input.phone,
              updatedAt: new Date()
            }
          })
          .returning({ id: customers.id });
        customerId = created?.id;
      }
      if (!customerId) throw new Error("Could not save customer details.");

      const [appointment] = await tx
        .insert(appointments)
        .values({
          publicReference: reference,
          businessId: business.id,
          customerId,
          status: "request_received",
          startsAt: available.startsAt,
          serviceEndsAt: available.endsAt,
          blockedUntil: available.blockedUntil,
          timezone: bookingPolicy.timezone,
          serviceAddress: input.address,
          customerAddress: input.customerAddress,
          vehicleDescription: input.vehicle,
          vehicleCategory: input.vehicleCategory,
          waterAvailable: input.waterAvailable,
          electricityAvailable: input.electricityAvailable,
          conditionNotes: input.conditionNotes,
          accessNotes: input.accessNotes,
          referralSource: input.referral,
          subtotalMinor: quote.subtotalMinor,
          discountMinor: quote.discountMinor,
          taxMinor: quote.taxMinor,
          totalMinor: quote.totalMinor,
          depositMinor: quote.depositMinor,
          currency: quote.currency,
          idempotencyKey: input.idempotencyKey
        })
        .returning({ id: appointments.id });
      if (!appointment) throw new Error("Could not save booking request.");

      await tx.insert(appointmentItems).values(
        packages.map((item, sortOrder) => ({
          appointmentId: appointment.id,
          packageId: item!.id,
          displayName: item!.name,
          quantity: 1,
          unitAmountMinor: item!.promotionalPriceMinor,
          durationMinutes: item!.durationMinutes,
          inclusions: [...item!.inclusions],
          sortOrder
        }))
      );
    });
    return Response.json(
      { reference, status: "request_received" },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json(
      { error: "We couldn't save your request. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
