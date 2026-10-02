import { describe, expect, it } from "vitest";
import {
  can,
  redactAuditMetadata,
  requireCapability,
  type Actor
} from "@/modules/identity-access/policy";
import {
  createSessionToken,
  hashSessionToken,
  isSessionActive,
  sessionExpiry
} from "@/modules/identity-access/session-token";

const owner: Actor = {
  userId: "user-1",
  businessId: "business-a",
  role: "owner",
  displayName: "Owner",
  email: "owner@example.test"
};
const staff: Actor = { ...owner, role: "staff" };

describe("business-scoped authorization", () => {
  it("allows owner configuration and denies staff or another business", () => {
    expect(can(owner, "manage_locations", "business-a")).toBe(true);
    expect(can(staff, "manage_locations", "business-a")).toBe(false);
    expect(can(owner, "manage_locations", "business-b")).toBe(false);
    expect(() =>
      requireCapability(staff, "manage_locations", "business-a")
    ).toThrow("permission");
  });

  it("redacts sensitive audit metadata", () => {
    expect(
      redactAuditMetadata({ token: "secret", action: "publish", count: 2 })
    ).toEqual({ token: "[REDACTED]", action: "publish", count: 2 });
  });
});

describe("session tokens", () => {
  it("creates high-entropy tokens and one-way hashes", () => {
    const token = createSessionToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(hashSessionToken(token)).not.toContain(token);
  });

  it("expires sessions after the configured window", () => {
    const now = new Date("2026-10-01T12:00:00Z");
    expect(
      isSessionActive(sessionExpiry(now), new Date("2026-10-07T12:00:00Z"))
    ).toBe(true);
    expect(
      isSessionActive(sessionExpiry(now), new Date("2026-10-08T12:00:01Z"))
    ).toBe(false);
  });
});
