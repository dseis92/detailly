import { describe, expect, it } from "vitest";
import {
  localDateTimeToUtc,
  searchAvailableSlots
} from "@/modules/availability/slots";

describe("availability slot search", () => {
  it("generates deterministic local-time slots and respects active holds", () => {
    const rangeStart = new Date("2026-10-05T00:00:00.000Z");
    const slots = searchAvailableSlots({
      rangeStart,
      rangeEnd: new Date("2026-10-06T00:00:00.000Z"),
      durationMinutes: 60,
      now: new Date("2026-10-01T00:00:00.000Z"),
      windows: [
        {
          weekday: 1,
          startLocal: "09:00",
          endLocal: "12:00",
          timezone: "America/Chicago",
          slotIntervalMinutes: 60,
          capacity: 1
        }
      ],
      holds: [
        {
          startsAt: new Date("2026-10-05T14:00:00.000Z"),
          endsAt: new Date("2026-10-05T15:00:00.000Z"),
          expiresAt: new Date("2026-10-06T13:30:00.000Z"),
          status: "active"
        }
      ]
    });

    expect(slots.map((slot) => slot.startsAt.toISOString())).toEqual([
      "2026-10-05T15:00:00.000Z",
      "2026-10-05T16:00:00.000Z"
    ]);
  });

  it("rejects a nonexistent spring-forward wall-clock time", () => {
    expect(
      localDateTimeToUtc("2026-03-08T02:30", "America/Chicago")
    ).toBeUndefined();
  });

  it("converts a normal wall-clock time to a UTC instant", () => {
    expect(
      localDateTimeToUtc("2026-10-05T09:00", "America/Chicago")?.toISOString()
    ).toBe("2026-10-05T14:00:00.000Z");
  });

  it("subtracts a time-off block before returning slots", () => {
    const slots = searchAvailableSlots({
      rangeStart: new Date("2026-10-05T00:00:00.000Z"),
      rangeEnd: new Date("2026-10-06T00:00:00.000Z"),
      durationMinutes: 60,
      windows: [
        {
          weekday: 1,
          startLocal: "09:00",
          endLocal: "12:00",
          timezone: "America/Chicago",
          slotIntervalMinutes: 60,
          capacity: 1
        }
      ],
      blockedIntervals: [
        {
          startsAt: new Date("2026-10-05T15:00:00.000Z"),
          endsAt: new Date("2026-10-05T16:00:00.000Z")
        }
      ]
    });

    expect(slots.map((slot) => slot.startsAt.toISOString())).toEqual([
      "2026-10-05T14:00:00.000Z",
      "2026-10-05T16:00:00.000Z"
    ]);
  });
});
