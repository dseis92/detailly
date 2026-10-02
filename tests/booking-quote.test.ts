import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/booking/quote/route";
const request = (body: unknown) =>
  new Request("http://localhost/api/booking/quote", {
    method: "POST",
    body: JSON.stringify(body)
  });
describe("booking quote endpoint", () => {
  it("ignores client prices and calculates the approved deposit", async () => {
    const response = await POST(
      request({ packageIds: ["full-sedan-coupe"], totalMinor: 1, taxMinor: 0 })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      subtotalMinor: 25000,
      taxMinor: 1375,
      totalMinor: 26375,
      depositMinor: 13188
    });
  });
  it("rejects duplicate, missing, or unknown packages", async () => {
    for (const packageIds of [
      [],
      ["unknown"],
      ["full-sedan-coupe", "full-sedan-coupe"]
    ]) {
      expect((await POST(request({ packageIds }))).status).toBe(400);
    }
  });
  it("rejects malformed request bodies", async () => {
    expect(
      (
        await POST(
          new Request("http://localhost", { method: "POST", body: "invalid" })
        )
      ).status
    ).toBe(400);
  });
});
