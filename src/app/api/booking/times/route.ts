import { z } from "zod";
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
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  packageIds: z.array(z.string()).min(1).max(12)
});
export async function POST(request: Request) {
  try {
    const { date, packageIds } = schema.parse(await request.json());
    const rangeStart = localDateTimeToUtc(
      `${date}T${bookingPolicy.opensAt}`,
      bookingPolicy.timezone
    );
    const rangeEnd = localDateTimeToUtc(
      `${date}T${bookingPolicy.closesAt}`,
      bookingPolicy.timezone
    );
    if (!rangeStart || !rangeEnd) throw new Error("Invalid date");
    const quote = calculateQuote(packageIds);
    const now = new Date();
    const slots = searchAvailableSlots({
      rangeStart,
      rangeEnd,
      durationMinutes: quote.durationMinutes,
      postServiceBufferMinutes: bookingPolicy.postServiceBufferMinutes,
      windows: operatingWindows,
      now
    }).filter(
      (slot) =>
        slot.startsAt >= rangeStart &&
        slot.endsAt <= rangeEnd &&
        slot.startsAt > now
    );
    return Response.json(
      {
        preview: true,
        timezone: bookingPolicy.timezone,
        crewCount: bookingPolicy.crewCount,
        postServiceBufferMinutes: bookingPolicy.postServiceBufferMinutes,
        slots: slots.map((slot) => ({
          startsAt: slot.startsAt.toISOString(),
          endsAt: slot.endsAt.toISOString(),
          blockedUntil: slot.blockedUntil.toISOString(),
          label: new Intl.DateTimeFormat("en-US", {
            timeZone: bookingPolicy.timezone,
            hour: "numeric",
            minute: "2-digit"
          }).format(slot.startsAt)
        }))
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json(
      { error: "Choose a valid date and service." },
      { status: 400 }
    );
  }
}
