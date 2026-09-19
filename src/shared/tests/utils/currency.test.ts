import { describe, expect, it } from "vitest";

import { formatCurrency } from "@/shared/utils/currency";

describe("formatCurrency", () => {
  it.each([
    ["INR", 12345, 123.45, 2],
    ["JPY", 500, 500, 0],
    ["BHD", 1250, 1.25, 3],
    ["AFN", 123, 1.23, 2],
    ["USD", -125, -1.25, 2],
  ] as const)(
    "formats %s minor units at the display boundary",
    (currency, amount, expected, decimals) => {
      expect(formatCurrency(amount, currency)).toBe(
        new Intl.NumberFormat(undefined, {
          style: "currency",
          currency,
          currencyDisplay: "narrowSymbol",
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(expected),
      );
    },
  );
  it("retains the last cent at the maximum safe integer", () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      currencyDisplay: "narrowSymbol",
    }).format("90071992547409.91" as unknown as number);
    expect(formatCurrency(Number.MAX_SAFE_INTEGER, "USD")).toBe(expected);
    expect(formatCurrency(Number.MAX_SAFE_INTEGER, "USD")).not.toBe(
      formatCurrency(Number.MAX_SAFE_INTEGER - 1, "USD"),
    );
  });
});
