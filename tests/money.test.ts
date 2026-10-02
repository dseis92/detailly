import { describe, expect, it } from "vitest";
import { currencyCode, money } from "@/domain/shared/money";

describe("money", () => {
  it("stores integer minor units and an explicit currency", () => {
    expect(money(12_500, currencyCode("USD"))).toEqual({
      amountMinor: 12_500,
      currency: "USD"
    });
  });

  it.each([10.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects non-integer amount %s",
    (amount) => {
      expect(() => money(amount, currencyCode("USD"))).toThrow(
        "safe integer minor units"
      );
    }
  );

  it("rejects malformed currency codes", () => {
    expect(() => currencyCode("usd")).toThrow("three-letter ISO 4217 code");
  });
});
