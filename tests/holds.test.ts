import { describe, expect, it } from "vitest";
import {
  createSlotHold,
  expireHold,
  hashHoldToken,
  isHoldActive
} from "@/modules/availability/holds";

describe("slot hold policy", () => {
  const now = new Date("2026-10-05T13:00:00.000Z");

  it("creates a short-lived hold with only a token hash", () => {
    const created = createSlotHold({
      now,
      startsAt: new Date("2026-10-05T14:00:00.000Z"),
      endsAt: new Date("2026-10-05T16:00:00.000Z"),
      idempotencyKey: "checkout-123"
    });

    expect(created.token).toHaveLength(32);
    expect(created.hold.tokenHash).toBe(hashHoldToken(created.token));
    expect(created.hold.expiresAt.toISOString()).toBe(
      "2026-10-05T13:15:00.000Z"
    );
    expect(isHoldActive(created.hold, now)).toBe(true);
    expect(created.hold.tokenHash).not.toContain(created.token);
  });

  it("expires a hold only after its expiry instant", () => {
    const created = createSlotHold({
      now,
      startsAt: new Date("2026-10-05T14:00:00.000Z"),
      endsAt: new Date("2026-10-05T16:00:00.000Z"),
      idempotencyKey: "checkout-456"
    });

    expect(
      expireHold(created.hold, new Date("2026-10-05T13:14:59.000Z")).status
    ).toBe("active");
    expect(
      expireHold(created.hold, new Date("2026-10-05T13:15:00.000Z")).status
    ).toBe("expired");
  });

  it("rejects invalid or excessively long holds", () => {
    expect(() =>
      createSlotHold({
        now,
        startsAt: now,
        endsAt: new Date("2026-10-05T16:00:00.000Z"),
        idempotencyKey: "invalid"
      })
    ).toThrow("future");
    expect(() =>
      createSlotHold({
        now,
        startsAt: new Date("2026-10-05T14:00:00.000Z"),
        endsAt: new Date("2026-10-06T00:00:00.000Z"),
        idempotencyKey: "too-long"
      })
    ).toThrow("8 hours");
  });
});
