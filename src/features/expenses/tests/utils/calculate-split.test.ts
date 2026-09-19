import { describe, expect, it } from "vitest";

import { calculateSplit } from "@/features/expenses/utils/calculate-split";

import type { Expense } from "@/shared/types/domain.types";

const members = (values: string[]) =>
  values.map((value, i) => ({ memberId: String.fromCharCode(97 + i), value }));

describe("calculateSplit", () => {
  it("assigns equal remainders by member ID rather than input order", () => {
    const result = calculateSplit(
      10000,
      "equal",
      [
        { memberId: "c", value: "" },
        { memberId: "a", value: "" },
        { memberId: "b", value: "" },
      ],
      "INR",
    );
    expect(result.owes).toEqual([
      { memberId: "c", amount: 3333 },
      { memberId: "a", amount: 3334 },
      { memberId: "b", amount: 3333 },
    ]);
    expect(result.splitMeta).toEqual([]);
  });
  it.each(["INR", "JPY", "BHD"])("preserves a one-minor-unit total in %s", (currency) => {
    expect(
      calculateSplit(1, "equal", members(["", "", ""]), currency).owes.map((row) => row.amount),
    ).toEqual([1, 0, 0]);
  });
  it("supports solo groups", () => {
    expect(calculateSplit(123, "equal", members([""]), "INR").owes[0].amount).toBe(123);
  });
  it("fills blank exact amounts with the remaining allocation", () => {
    expect(
      calculateSplit(10001, "amount", members(["10", "", ""]), "INR").owes.map((row) => row.amount),
    ).toEqual([1000, 4501, 4500]);
  });
  it("allows explicit zero and a fully assigned exact split", () => {
    expect(
      calculateSplit(10000, "amount", members(["0", "100"]), "INR").owes.map((row) => row.amount),
    ).toEqual([0, 10000]);
  });
  it("allocates proportional shares and preserves metadata", () => {
    const result = calculateSplit(40000, "shares", members(["1", "1", "2"]), "INR");
    expect(result.owes.map((row) => row.amount)).toEqual([10000, 10000, 20000]);
    expect(result.splitMeta.map((row) => row.value)).toEqual([1, 1, 2]);
  });
  it("uses largest fractional remainder before member ID", () => {
    expect(
      calculateSplit(5, "shares", members(["1", "2"]), "JPY").owes.map((row) => row.amount),
    ).toEqual([2, 3]);
  });
  it("handles decimal percentages exactly", () => {
    const result = calculateSplit(100, "percentage", members(["33.33", "33.33", "33.34"]), "INR");
    expect(result.owes.map((row) => row.amount)).toEqual([33, 33, 34]);
    expect(result.splitMeta.map((row) => row.value)).toEqual([33.33, 33.33, 33.34]);
  });
  it("supports positive and negative adjustments", () => {
    const result = calculateSplit(10000, "adjustment", members(["-10", "10"]), "INR");
    expect(result.owes.map((row) => row.amount)).toEqual([4000, 6000]);
    expect(result.splitMeta.map((row) => row.value)).toEqual([-1000, 1000]);
  });
  it("allows a negative base if all final quotas are nonnegative", () => {
    expect(
      calculateSplit(100, "adjustment", members(["2", "2"]), "INR").owes.map((row) => row.amount),
    ).toEqual([50, 50]);
  });
  it("rejects a negative exact quota before rounding", () => {
    expect(() => calculateSplit(1, "adjustment", members(["-1", "1"]), "INR")).toThrow("negative");
  });
  it.each([
    ["amount", ["99", "0"]],
    ["amount", ["101", ""]],
    ["amount", ["-1", "101"]],
    ["percentage", ["50", "49.999999"]],
    ["percentage", ["0", "100"]],
    ["shares", ["0", "1"]],
    ["shares", ["-1", "1"]],
    ["shares", ["Infinity", "1"]],
    ["shares", ["0.0000001", "1"]],
  ] as [Expense["splitType"], string[]][])("rejects invalid %s values %j", (method, values) => {
    expect(() => calculateSplit(10000, method, members(values), "INR")).toThrow();
  });
  it.each([0, -1, NaN, Infinity, 1.1, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid total %s",
    (total) => {
      expect(() => calculateSplit(total, "equal", members([""]), "INR")).toThrow();
    },
  );
  it("rejects missing and duplicate participants", () => {
    expect(() => calculateSplit(1, "equal", [], "INR")).toThrow();
    expect(() =>
      calculateSplit(
        1,
        "equal",
        [
          { memberId: "a", value: "" },
          { memberId: "a", value: "" },
        ],
        "INR",
      ),
    ).toThrow();
  });
  it("preserves safe-integer maximum totals with large ratios", () => {
    const result = calculateSplit(
      Number.MAX_SAFE_INTEGER,
      "shares",
      members(["1000000", "999999"]),
      "INR",
    );
    expect(result.owes.reduce((sum, row) => sum + BigInt(row.amount), 0n)).toBe(
      BigInt(Number.MAX_SAFE_INTEGER),
    );
    expect(result.owes.every((row) => Number.isSafeInteger(row.amount))).toBe(true);
  });
});
