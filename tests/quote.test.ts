import { describe, expect, it } from "vitest";
import { catalogPackages } from "@/modules/catalog-pricing/catalog";
import { calculateQuote } from "@/modules/catalog-pricing/quote";
import {
  haversineMeters,
  isWithinRadius
} from "@/modules/serviceability/policy";

describe("approved mobile catalog", () => {
  it("contains three groups and four vehicle-specific packages per group", () => {
    expect(catalogPackages).toHaveLength(12);
    expect(new Set(catalogPackages.map((item) => item.group))).toEqual(
      new Set(["interior-detail", "exterior-detail", "full-detail"])
    );
  });

  it("calculates original-price savings, 5.5% tax, and a 50% deposit", () => {
    const quote = calculateQuote(["full-sedan-coupe"]);
    expect(quote.discountMinor).toBe(8_333);
    expect(quote.subtotalMinor).toBe(25_000);
    expect(quote.taxMinor).toBe(1_375);
    expect(quote.totalMinor).toBe(26_375);
    expect(quote.depositMinor).toBe(13_188);
    expect(quote.durationMinutes).toBe(180);
  });

  it("rejects empty, duplicate, and unknown packages", () => {
    expect(() => calculateQuote([])).toThrow("at least one");
    expect(() =>
      calculateQuote(["interior-sedan-coupe", "interior-sedan-coupe"])
    ).toThrow("once");
    expect(() => calculateQuote(["unknown"])).toThrow("unavailable");
  });
});

describe("mobile service area geometry", () => {
  const center = { latitude: 47.590489, longitude: -122.12431 };

  it("accepts a point inside and rejects a point outside a radius", () => {
    expect(isWithinRadius(center, { center, radiusMeters: 100 })).toBe(true);
    expect(
      isWithinRadius(
        { latitude: 47.7, longitude: -122.1 },
        { center, radiusMeters: 100 }
      )
    ).toBe(false);
  });

  it("uses meter distances", () => {
    expect(haversineMeters(center, center)).toBe(0);
  });
});
