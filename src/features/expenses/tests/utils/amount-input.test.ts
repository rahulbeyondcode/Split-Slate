import { describe, expect, it } from "vitest";

import {
  formatExpenseAmountInput,
  sanitizeExpenseAmountInput,
} from "@/features/expenses/utils/amount-input";

describe("sanitizeExpenseAmountInput", () => {
  it.each([
    ["", ""],
    ["0", "0"],
    ["1234", "1234"],
    ["1234.", "1234."],
    ["1234.5", "1234.5"],
    ["1234.50", "1234.50"],
    ["1234.56789", "1234.56"],
    ["1234.999", "1234.99"],
    [".", "."],
    [".009", ".00"],
    ["0001234.050", "0001234.05"],
    ["INR -1,234.5.6e789", "1234.56"],
    ["letters only!", ""],
    ["99999999.99", "99999999.99"],
    ["123456789", "12345678"],
    ["123456789.123", "12345678.12"],
    ["99,999,999,999.999", "99999999.99"],
    ["90071992547409.91999", "90071992.91"],
    ["000012345.67", "00001234.67"],
  ])("limits %j to %j without rounding", (value, expected) => {
    expect(sanitizeExpenseAmountInput(value)).toBe(expected);
  });

  it("groups the limited value without persisting display commas", () => {
    const value = sanitizeExpenseAmountInput("1,23,456.789");
    expect(value).toBe("123456.78");
    expect(formatExpenseAmountInput(value)).toBe("123,456.78");
  });
});

describe("formatExpenseAmountInput", () => {
  it.each([
    ["", ""],
    ["1", "1"],
    ["123", "123"],
    ["1234", "1,234"],
    ["12345", "12,345"],
    ["123456", "123,456"],
    ["1234567", "1,234,567"],
    ["1234567.89", "1,234,567.89"],
    ["1234.00", "1,234.00"],
    ["1234.", "1,234."],
    [".", "."],
    [".50", ".50"],
    ["0001234.050", "0,001,234.050"],
    ["1234567.123", "1,234,567.123"],
    ["90071992547409.91", "90,071,992,547,409.91"],
    ["9007199254740993123456789.01", "9,007,199,254,740,993,123,456,789.01"],
  ])("formats %j as %j without changing entered precision", (value, expected) => {
    expect(formatExpenseAmountInput(value)).toBe(expected);
  });
});
