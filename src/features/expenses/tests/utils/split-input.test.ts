import { describe, expect, it } from "vitest";

import {
  capPercentageInput,
  previewIncompleteSplit,
  sanitizeDecimalInput,
  sanitizeSplitInput,
} from "@/features/expenses/utils/split-input";

describe("sanitizeSplitInput", () => {
  it("keeps decimal digits without exponent syntax or repeated separators", () => {
    expect(sanitizeSplitInput("12a.3.4e5", "amount")).toBe("12.345");
    expect(sanitizeSplitInput("-1,200.50", "amount")).toBe("1200.50");
    expect(sanitizeSplitInput("9007199254.740991", "shares")).toBe("9007199254.740991");
  });

  it("allows a leading minus sign only for adjustments", () => {
    expect(sanitizeSplitInput("-10.25", "adjustment")).toBe("-10.25");
    expect(sanitizeSplitInput("--1.2", "adjustment")).toBe("-1.2");
    expect(sanitizeSplitInput("1-2", "adjustment")).toBe("12");
    expect(sanitizeSplitInput("-20", "percentage")).toBe("20");
  });

  it("filters payer amounts without allowing negative contributions", () => {
    expect(sanitizeDecimalInput("12abc.50")).toBe("12.50");
    expect(sanitizeDecimalInput("-1,200.00")).toBe("1200.00");
  });

  it("caps a typed percentage to the remainder after other entered fields", () => {
    expect(capPercentageInput("125", [])).toBe("100");
    expect(capPercentageInput("70", [{ memberId: "a", value: "40" }])).toBe("60");
    expect(
      capPercentageInput("66.666667", [{ memberId: "a", value: "33.333334" }]),
    ).toBe("66.666666");
    expect(capPercentageInput(".5", [{ memberId: "a", value: "50" }])).toBe(".5");
    expect(capPercentageInput("40.", [{ memberId: "a", value: "20" }])).toBe("40.");
  });
});

describe("previewIncompleteSplit", () => {
  const participants = [
    { memberId: "a", value: "25" },
    { memberId: "b", value: "" },
  ];

  it("previews entered percentages against the full total before they add to 100", () => {
    expect(previewIncompleteSplit(10001, "percentage", participants, "INR")).toEqual([
      { memberId: "a", amount: 2500 },
    ]);
    expect(
      previewIncompleteSplit(10001, "percentage", [{ memberId: "a", value: "125" }], "INR"),
    ).toEqual([]);
  });

  it("previews available shares and exact amounts while other entries are blank", () => {
    expect(previewIncompleteSplit(10000, "shares", participants, "INR")).toEqual([
      { memberId: "a", amount: 10000 },
    ]);
    expect(previewIncompleteSplit(10000, "amount", participants, "INR")).toEqual([
      { memberId: "a", amount: 2500 },
      { memberId: "b", amount: 0 },
    ]);
  });
});
