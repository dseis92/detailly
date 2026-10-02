import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/lib/config/env";

const valid = {
  NODE_ENV: "test",
  APP_BASE_URL: "http://localhost:3000",
  APP_DEFAULT_CURRENCY: "USD",
  BUSINESS_TIMEZONE: "America/Chicago",
  DATABASE_URL: "postgresql://detailly:local@localhost:5432/detailly"
};

describe("server environment", () => {
  it("accepts valid, explicit foundation configuration", () => {
    expect(parseServerEnv(valid)).toMatchObject({
      NODE_ENV: "test",
      APP_DEFAULT_CURRENCY: "USD",
      BUSINESS_TIMEZONE: "America/Chicago"
    });
  });

  it.each([
    ["floating currency", { ...valid, APP_DEFAULT_CURRENCY: "usd" }],
    ["invalid timezone", { ...valid, BUSINESS_TIMEZONE: "Central-ish" }],
    [
      "non-PostgreSQL database",
      { ...valid, DATABASE_URL: "mysql://localhost/detailly" }
    ]
  ])("rejects %s", (_label, input) => {
    expect(() => parseServerEnv(input)).toThrow();
  });
});
