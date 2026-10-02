export type CurrencyCode = string & { readonly __brand: "CurrencyCode" };

export interface Money {
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
}

export function currencyCode(value: string): CurrencyCode {
  if (!/^[A-Z]{3}$/.test(value)) {
    throw new Error("Currency must be a three-letter ISO 4217 code.");
  }
  return value as CurrencyCode;
}

export function money(amountMinor: number, currency: CurrencyCode): Money {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new Error("Money must use safe integer minor units.");
  }
  return Object.freeze({ amountMinor, currency });
}
