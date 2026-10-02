import { describe, expect, it } from "vitest";
import { searchAvailableSlots } from "@/modules/availability/slots";
const input = {
  rangeStart: new Date("2026-10-05T14:00:00Z"),
  rangeEnd: new Date("2026-10-06T02:00:00Z"),
  now: new Date("2026-10-01T00:00:00Z"),
  durationMinutes: 120,
  postServiceBufferMinutes: 45,
  windows: [
    {
      weekday: 1,
      startLocal: "09:00",
      endLocal: "21:00",
      timezone: "America/Chicago",
      slotIntervalMinutes: 15,
      capacity: 1
    }
  ]
};
describe("45-minute crew buffer", () => {
  it("makes 11:45 the next start after a 9–11 interior detail", () => {
    const slots = searchAvailableSlots({
      ...input,
      holds: [
        {
          startsAt: new Date("2026-10-05T14:00:00Z"),
          endsAt: new Date("2026-10-05T16:45:00Z"),
          expiresAt: new Date("2026-10-06T00:00:00Z"),
          status: "active"
        }
      ]
    });
    expect(slots[0]?.startsAt.toISOString()).toBe("2026-10-05T16:45:00.000Z");
    expect(slots[0]?.endsAt.toISOString()).toBe("2026-10-05T18:45:00.000Z");
    expect(slots[0]?.blockedUntil.toISOString()).toBe(
      "2026-10-05T19:30:00.000Z"
    );
  });
  it("rejects a start when its buffer would overlap the next reserved job", () => {
    const slots = searchAvailableSlots({
      ...input,
      holds: [
        {
          startsAt: new Date("2026-10-05T16:30:00Z"),
          endsAt: new Date("2026-10-05T19:15:00Z"),
          expiresAt: new Date("2026-10-06T00:00:00Z"),
          status: "active"
        }
      ]
    });
    expect(
      slots.some((s) => s.startsAt.toISOString() === "2026-10-05T14:00:00.000Z")
    ).toBe(false);
  });
  it("allows service finishing at closing and carries its buffer afterward", () => {
    const slots = searchAvailableSlots(input);
    expect(slots.at(-1)?.endsAt.toISOString()).toBe("2026-10-06T02:00:00.000Z");
    expect(slots.at(-1)?.blockedUntil.toISOString()).toBe(
      "2026-10-06T02:45:00.000Z"
    );
  });
});
