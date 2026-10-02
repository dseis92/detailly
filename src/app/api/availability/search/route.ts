import { z } from "zod";
import {
  searchAvailableSlots,
  type AvailabilityWindow,
  type BlockedInterval,
  type OccupiedHold
} from "@/modules/availability/slots";

const windowSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startLocal: z.string().regex(/^\d{2}:\d{2}$/),
  endLocal: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().min(1),
  slotIntervalMinutes: z.number().int().positive(),
  capacity: z.number().int().positive()
});

const holdSchema = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  status: z.enum(["active", "converted", "released"])
});

const blockedIntervalSchema = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date()
});

const searchSchema = z.object({
  rangeStart: z.coerce.date(),
  rangeEnd: z.coerce.date(),
  durationMinutes: z.number().int().positive(),
  now: z.coerce.date().optional(),
  windows: z.array(windowSchema).min(1),
  holds: z.array(holdSchema).optional(),
  blockedIntervals: z.array(blockedIntervalSchema).optional()
});

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const parsed = searchSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid availability search.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const searchInput = {
      rangeStart: parsed.data.rangeStart,
      rangeEnd: parsed.data.rangeEnd,
      durationMinutes: parsed.data.durationMinutes,
      windows: parsed.data.windows as AvailabilityWindow[],
      ...(parsed.data.now ? { now: parsed.data.now } : {}),
      ...(parsed.data.holds
        ? { holds: parsed.data.holds as OccupiedHold[] }
        : {}),
      ...(parsed.data.blockedIntervals
        ? {
            blockedIntervals: parsed.data.blockedIntervals as BlockedInterval[]
          }
        : {})
    };
    const result = searchAvailableSlots(searchInput);
    return Response.json(
      {
        slots: result.map((slot) => ({
          startsAt: slot.startsAt.toISOString(),
          endsAt: slot.endsAt.toISOString(),
          timezone: slot.timezone
        }))
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Availability search failed."
      },
      { status: 422 }
    );
  }
}
