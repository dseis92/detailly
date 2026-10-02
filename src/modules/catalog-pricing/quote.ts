import { getCatalogPackage } from "./catalog";

export const SALES_TAX_BASIS_POINTS = 550;
export const DEPOSIT_BASIS_POINTS = 5_000;

export interface QuoteLine {
  readonly packageId: string;
  readonly name: string;
  readonly quantity: 1;
  readonly originalPriceMinor: number;
  readonly promotionalPriceMinor: number;
  readonly discountMinor: number;
  readonly durationMinutes: number;
}

export interface Quote {
  readonly currency: "USD";
  readonly lines: readonly QuoteLine[];
  readonly subtotalMinor: number;
  readonly discountMinor: number;
  readonly taxableMinor: number;
  readonly taxMinor: number;
  readonly totalMinor: number;
  readonly depositMinor: number;
  readonly durationMinutes: number;
}

export function calculateQuote(packageIds: readonly string[]): Quote {
  if (packageIds.length === 0)
    throw new Error("Choose at least one service package.");
  if (new Set(packageIds).size !== packageIds.length)
    throw new Error("A package can only be selected once.");

  const lines = packageIds.map((packageId) => {
    const service = getCatalogPackage(packageId);
    return {
      packageId: service.id,
      name: service.name,
      quantity: 1 as const,
      originalPriceMinor: service.originalPriceMinor,
      promotionalPriceMinor: service.promotionalPriceMinor,
      discountMinor: service.originalPriceMinor - service.promotionalPriceMinor,
      durationMinutes: service.durationMinutes
    };
  });
  const subtotalMinor = sum(lines.map((line) => line.promotionalPriceMinor));
  const discountMinor = sum(lines.map((line) => line.discountMinor));
  const taxableMinor = subtotalMinor;
  const taxMinor = roundMinor(taxableMinor * SALES_TAX_BASIS_POINTS, 10_000);
  const totalMinor = subtotalMinor + taxMinor;
  const depositMinor = roundMinor(totalMinor * DEPOSIT_BASIS_POINTS, 10_000);

  return {
    currency: "USD",
    lines,
    subtotalMinor,
    discountMinor,
    taxableMinor,
    taxMinor,
    totalMinor,
    depositMinor,
    durationMinutes: sum(lines.map((line) => line.durationMinutes))
  };
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function roundMinor(numerator: number, denominator: number): number {
  return Math.floor((numerator + denominator / 2) / denominator);
}
