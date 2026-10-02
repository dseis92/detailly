import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/booking/times/route";
const request = (body: unknown) =>
  new Request("http://localhost/api/booking/times", {
    method: "POST",
    body: JSON.stringify(body)
  });
describe("booking times endpoint", () => {
  it("uses approved hours and catalog duration rather than client values", async () => {
    const result = await POST(
      request({
        date: "2099-01-01",
        packageIds: ["full-large-suv-large-truck"],
        durationMinutes: 1,
        capacity: 20,
        postServiceBufferMinutes: 0
      })
    );
    expect(result.status).toBe(200);
    const data = await result.json();
    expect(data).toMatchObject({
      preview: true,
      crewCount: 1,
      postServiceBufferMinutes: 45,
      timezone: "America/Chicago"
    });
    expect(data.slots).toHaveLength(33);
    expect(data.slots[0]).toMatchObject({ label: "9:00 AM" });
    expect(data.slots.at(-1)).toMatchObject({ label: "5:00 PM" });
    expect(
      new Date(data.slots[0].endsAt).getTime() -
        new Date(data.slots[0].startsAt).getTime()
    ).toBe(4 * 60 * 60 * 1000);
  });
  it("blocks a two-hour sedan interior for two hours and 45 minutes", async () => {
    const result = await POST(
      request({ date: "2099-01-01", packageIds: ["interior-sedan-coupe"] })
    );
    const slot = (await result.json()).slots[0];
    expect(
      new Date(slot.endsAt).getTime() - new Date(slot.startsAt).getTime()
    ).toBe(120 * 60000);
    expect(
      new Date(slot.blockedUntil).getTime() - new Date(slot.startsAt).getTime()
    ).toBe(165 * 60000);
  });
  it("returns no past times", async () => {
    const result = await POST(
      request({ date: "2000-01-01", packageIds: ["full-sedan-coupe"] })
    );
    expect((await result.json()).slots).toEqual([]);
  });
  it("rejects impossible dates and unavailable services", async () => {
    for (const body of [
      { date: "2027-02-31", packageIds: ["full-sedan-coupe"] },
      { date: "2099-01-01", packageIds: ["not-a-package"] }
    ])
      expect((await POST(request(body))).status).toBe(400);
  });
});
