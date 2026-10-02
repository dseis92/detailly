import { describe, expect, it } from "vitest";
import {
  bookingPolicy,
  isInBusinessServiceArea,
  operatingWindows
} from "@/modules/business-config/booking-policy";
import {
  localDateTimeToUtc,
  searchAvailableSlots
} from "@/modules/availability/slots";
describe("approved business policy", () => {
  it("covers all seven anchor points but not Madison", () => {
    for (const point of bookingPolicy.centers)
      expect(isInBusinessServiceArea(point)).toBe(true);
    expect(
      isInBusinessServiceArea({ latitude: 43.0731, longitude: -89.4012 })
    ).toBe(false);
    expect(() =>
      isInBusinessServiceArea({ latitude: NaN, longitude: 0 })
    ).toThrow();
  });
  it("uses a union of exact 60-mile radii", () => {
    const center = bookingPolicy.centers.find((c) => c.zip === "54403")!;
    const point = (miles: number) => ({
      latitude:
        center.latitude + (((miles * 1609.344) / 6371000) * 180) / Math.PI,
      longitude: center.longitude
    });
    expect(isInBusinessServiceArea(point(59.99))).toBe(true);
    expect(isInBusinessServiceArea(point(60.01))).toBe(false);
  });
  it("opens all seven days from 9am to 9pm with capacity one", () => {
    expect(operatingWindows).toHaveLength(7);
    expect(operatingWindows.map((w) => w.weekday)).toEqual([
      0, 1, 2, 3, 4, 5, 6
    ]);
    for (const window of operatingWindows)
      expect(window).toMatchObject({
        startLocal: "09:00",
        endLocal: "21:00",
        capacity: 1,
        timezone: "America/Chicago"
      });
  });
  it.each(["2026-10-04", "2026-11-01", "2027-03-14"])(
    "offers Sunday times ending by closing, including DST: %s",
    (date) => {
      const rangeStart = localDateTimeToUtc(
        `${date}T09:00`,
        bookingPolicy.timezone
      )!;
      const rangeEnd = localDateTimeToUtc(
        `${date}T21:00`,
        bookingPolicy.timezone
      )!;
      const slots = searchAvailableSlots({
        rangeStart,
        rangeEnd,
        durationMinutes: 240,
        postServiceBufferMinutes: bookingPolicy.postServiceBufferMinutes,
        windows: operatingWindows,
        now: new Date("2026-01-01")
      }).filter((s) => s.startsAt >= rangeStart && s.endsAt <= rangeEnd);
      expect(slots[0]?.startsAt).toEqual(rangeStart);
      expect(slots.at(-1)?.endsAt).toEqual(rangeEnd);
      expect(slots).toHaveLength(33);
    }
  );
});
