import { describe, expect, it } from "vitest";

import { formatPercentageDisplay } from "@/features/expenses/utils/percentage-display";

describe("formatPercentageDisplay", () => {
  it.each([
    ["33.333334", "33.333"],
    ["33.333500", "33.334"],
    ["66.666666", "66.667"],
    ["33.330000", "33.33"],
    ["12.300001", "12.3"],
    ["99.999999", "100"],
    ["0.000001", "0"],
    ["40", "40"],
  ])("displays %s as %s without exceeding three decimals", (input, displayed) => {
    expect(formatPercentageDisplay(input)).toBe(displayed);
  });

  it("formats legacy numeric metadata without changing its source value", () => {
    const value = 12.34567;
    expect(formatPercentageDisplay(value)).toBe("12.346");
    expect(value).toBe(12.34567);
  });
});
