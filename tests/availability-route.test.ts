import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/availability/search/route";

describe("availability search API", () => {
  it("returns UTC slots from validated local windows", async () => {
    const response = await POST(
      new Request("http://localhost/api/availability/search", {
        method: "POST",
        body: JSON.stringify({
          rangeStart: "2026-10-05T00:00:00.000Z",
          rangeEnd: "2026-10-06T00:00:00.000Z",
          durationMinutes: 120,
          now: "2026-10-01T00:00:00.000Z",
          windows: [
            {
              weekday: 1,
              startLocal: "09:00",
              endLocal: "13:00",
              timezone: "America/Chicago",
              slotIntervalMinutes: 60,
              capacity: 1
            }
          ]
        }),
        headers: { "content-type": "application/json" }
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      slots: [
        {
          startsAt: "2026-10-05T14:00:00.000Z",
          endsAt: "2026-10-05T16:00:00.000Z",
          timezone: "America/Chicago"
        },
        {
          startsAt: "2026-10-05T15:00:00.000Z",
          endsAt: "2026-10-05T17:00:00.000Z",
          timezone: "America/Chicago"
        },
        {
          startsAt: "2026-10-05T16:00:00.000Z",
          endsAt: "2026-10-05T18:00:00.000Z",
          timezone: "America/Chicago"
        }
      ]
    });
  });

  it("rejects malformed requests without running a search", async () => {
    const response = await POST(
      new Request("http://localhost/api/availability/search", {
        method: "POST",
        body: JSON.stringify({ durationMinutes: 0 }),
        headers: { "content-type": "application/json" }
      })
    );

    expect(response.status).toBe(400);
  });
});
