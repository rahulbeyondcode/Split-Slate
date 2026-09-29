import { describe, expect, it } from "vitest";

import { currencyDecimals, moneyToDecimal, parseMoney } from "@/shared/utils/money";

describe("money conversion", () => {
  it.each([
    ["INR", "123.45", 12345],
    ["USD", "0.01", 1],
    ["JPY", "500", 50000],
    ["JPY", "123.45", 12345],
    ["BHD", "1.25", 125],
    ["AFN", "1.23", 123],
    ["IRR", "1.23", 123],
    ["INR", " 00012.5 ", 1250],
    ["INR", "0", 0],
  ])("parses %s %s exactly", (currency, value, expected) => {
    expect(parseMoney(value, currency)).toBe(expected);
  });
  it.each(["", " ", "NaN", "Infinity", "1e3", "-1", "1,000", "1.001", "12x", ".", ".5"])(
    "rejects invalid INR input %s",
    (value) => {
      expect(() => parseMoney(value, "INR")).toThrow();
    },
  );
  it("rejects more than two decimals for every currency", () => {
    expect(() => parseMoney("1.001", "JPY")).toThrow("2 decimal");
    expect(() => parseMoney("1.250", "BHD")).toThrow("2 decimal");
    expect(currencyDecimals("JPY")).toBe(2);
    expect(currencyDecimals("BHD")).toBe(2);
  });
  it("handles signed adjustments", () => {
    expect(parseMoney("-1.25", "INR", true)).toBe(-125);
    expect(moneyToDecimal(-125, "INR")).toBe("-1.25");
  });
  it("round-trips the safe integer boundary without floating-point loss", () => {
    const value = "90071992547409.91";
    expect(parseMoney(value, "INR")).toBe(Number.MAX_SAFE_INTEGER);
    expect(moneyToDecimal(Number.MAX_SAFE_INTEGER, "INR")).toBe(value);
    expect(() => parseMoney("90071992547409.92", "INR")).toThrow("too large");
  });
  it("formats fixed hundredths for every currency", () => {
    expect(moneyToDecimal(1, "INR")).toBe("0.01");
    expect(moneyToDecimal(1, "BHD")).toBe("0.01");
    expect(moneyToDecimal(1, "JPY")).toBe("0.01");
    expect(() => moneyToDecimal(0.1, "INR")).toThrow();
  });
  it("rejects unsupported currencies", () => {
    expect(() => currencyDecimals("XXX")).toThrow("Unsupported currency");
  });
});
