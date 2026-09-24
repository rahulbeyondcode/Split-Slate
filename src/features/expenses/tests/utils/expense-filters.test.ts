import { describe, expect, it } from "vitest";

import {
  countActiveExpenseFilters,
  createExpenseFilterDefaults,
  createExpenseFilterSchema,
  filterExpenses,
  pruneUnavailableExpenseFilterOptions,
} from "@/features/expenses/utils/expense-filters";

import type { ExpenseFilterValues } from "@/features/expenses/types/expense-filters.types";
import type { Expense } from "@/shared/types/domain.types";

const expense = (patch: Partial<Expense> = {}): Expense => ({
  expenseId: "dinner",
  groupId: "trip",
  expenseName: "Dinner",
  categoryId: "food",
  createdBy: "a",
  createdAt: 0,
  when: new Date(2026, 8, 20, 12).getTime(),
  splitType: "equal",
  splitMeta: [],
  tagIds: ["holiday", "work"],
  attachmentIds: [],
  transactions: {
    paid: [
      { memberId: "a", amount: 4000 },
      { memberId: "b", amount: 6001 },
    ],
    owes: [
      { memberId: "b", amount: 10001 },
      { memberId: "c", amount: 0 },
    ],
  },
  ...patch,
});
const values = (patch: Partial<ExpenseFilterValues> = {}) => ({
  ...createExpenseFilterDefaults(),
  ...patch,
});

describe("expense filters", () => {
  it("returns all expenses without mutating the source, and trims case-insensitive search", () => {
    const source = [expense(), expense({ expenseId: "taxi", expenseName: "Taxi" })];
    expect(filterExpenses(source, values(), "INR")).toEqual(source);
    expect(filterExpenses(source, values({ name: "  INn  " }), "INR")).toEqual([source[0]]);
    expect(source).toHaveLength(2);
  });

  it.each([
    { categoryIds: ["other", "food"] },
    { tagIds: ["other", "work"] },
    { payerIds: ["other", "b"] },
    { memberIds: ["other", "c"] },
    { splitTypes: ["amount", "equal"] },
  ] satisfies Partial<ExpenseFilterValues>[])("matches any selected option: %j", (patch) => {
    expect(filterExpenses([expense()], values(patch), "INR")).toHaveLength(1);
  });

  it.each([
    { categoryIds: ["missing"] },
    { tagIds: ["missing"] },
    { payerIds: ["c"] },
    { memberIds: ["missing"] },
    { splitTypes: ["shares"] },
  ] satisfies Partial<ExpenseFilterValues>[])("rejects nonmatching selections: %j", (patch) => {
    expect(filterExpenses([expense()], values(patch), "INR")).toHaveLength(0);
  });

  it("ANDs all eight fields and includes payer-only involvement", () => {
    const all = values({
      name: "dinner",
      dateFrom: "2026-09-20",
      dateTo: "2026-09-20",
      categoryIds: ["food"],
      tagIds: ["work"],
      payerIds: ["a"],
      memberIds: ["a"],
      splitTypes: ["equal"],
      minAmount: "100.01",
      maxAmount: "100.01",
    });
    expect(filterExpenses([expense()], all, "INR")).toHaveLength(1);
    expect(filterExpenses([expense()], { ...all, tagIds: ["missing"] }, "INR")).toHaveLength(0);
    expect(countActiveExpenseFilters(all)).toBe(8);
  });

  it("matches inclusive local calendar days, independently of creation date", () => {
    const start = new Date(2026, 8, 20).getTime();
    const end = new Date(2026, 8, 21).getTime();
    const source = [start - 1, start, end - 1, end].map((when) => expense({ when }));
    expect(
      filterExpenses(source, values({ dateFrom: "2026-09-20", dateTo: "2026-09-20" }), "INR"),
    ).toEqual(source.slice(1, 3));
    expect(filterExpenses(source, values({ dateFrom: "2026-09-20" }), "INR")).toEqual(
      source.slice(1),
    );
    expect(filterExpenses(source, values({ dateTo: "2026-09-20" }), "INR")).toEqual(
      source.slice(0, 3),
    );
  });

  it.each(["equal", "amount", "shares", "percentage", "adjustment"] as const)(
    "matches the %s split type",
    (splitType) => {
      expect(
        filterExpenses([expense({ splitType })], values({ splitTypes: [splitType] }), "INR"),
      ).toHaveLength(1);
    },
  );

  it("uses the sum of all payers and inclusive exact amount bounds", () => {
    expect(
      filterExpenses([expense()], values({ minAmount: "100.01", maxAmount: "100.01" }), "INR"),
    ).toHaveLength(1);
    expect(filterExpenses([expense()], values({ minAmount: "100.02" }), "INR")).toHaveLength(0);
    expect(filterExpenses([expense()], values({ maxAmount: "100.00" }), "INR")).toHaveLength(0);
    expect(filterExpenses([expense()], values({ maxAmount: "0" }), "INR")).toHaveLength(0);
  });

  it.each([
    ["JPY", "10001"],
    ["KWD", "10.001"],
  ])("respects %s precision", (currency, amount) => {
    expect(
      filterExpenses([expense()], values({ minAmount: amount, maxAmount: amount }), currency),
    ).toHaveLength(1);
  });

  it("handles untagged expenses and empty source lists", () => {
    expect(
      filterExpenses([expense({ tagIds: [] })], values({ tagIds: ["holiday"] }), "INR"),
    ).toEqual([]);
    expect(filterExpenses([], values(), "INR")).toEqual([]);
  });

  it("counts fields rather than individual selections; whitespace is inactive", () => {
    expect(countActiveExpenseFilters(values({ name: "  ", minAmount: " " }))).toBe(0);
    expect(
      countActiveExpenseFilters(
        values({
          dateFrom: "2026-09-20",
          dateTo: "2026-09-21",
          categoryIds: ["a", "b"],
          maxAmount: "0",
        }),
      ),
    ).toBe(3);
  });

  it("prunes unavailable option IDs while preserving valid selections and scalar filters", () => {
    const current = values({
      name: "Dinner",
      categoryIds: ["food", "deleted-category"],
      tagIds: ["deleted-tag", "work"],
      payerIds: ["deleted-member", "a"],
      memberIds: ["b", "deleted-member"],
      splitTypes: ["equal"],
      minAmount: "10",
    });

    expect(
      pruneUnavailableExpenseFilterOptions(current, {
        categoryIds: ["food"],
        tagIds: ["work"],
        payerIds: ["a", "b"],
        memberIds: ["a", "b"],
      }),
    ).toEqual({
      ...current,
      categoryIds: ["food"],
      tagIds: ["work"],
      payerIds: ["a"],
      memberIds: ["b"],
    });
  });
});

describe("filter validation", () => {
  it.each([
    { dateFrom: "2026-02-29" },
    { dateTo: "2026-04-31" },
    { dateFrom: "2026-13-01" },
    { dateFrom: "0000-01-01" },
    { dateTo: "20-09-2026" },
    { dateFrom: "2026-09-21", dateTo: "2026-09-20" },
    { minAmount: "-1" },
    { maxAmount: "1e3" },
    { minAmount: "NaN" },
    { minAmount: "1.001" },
    { maxAmount: "90071992547409.92" },
    { minAmount: "1.01", maxAmount: "1.00" },
  ])("rejects invalid bounds: %j", (patch) => {
    expect(createExpenseFilterSchema("INR").safeParse(values(patch)).success).toBe(false);
  });

  it("accepts empty, zero, same-day, leap-day, and maximum-safe bounds", () => {
    for (const patch of [
      {},
      { minAmount: "0", maxAmount: "0" },
      { dateFrom: "2024-02-29", dateTo: "2024-02-29" },
      { maxAmount: "90071992547409.91" },
    ]) {
      expect(createExpenseFilterSchema("INR").safeParse(values(patch)).success).toBe(true);
    }
  });

  it("rejects excess currency precision", () => {
    expect(createExpenseFilterSchema("JPY").safeParse(values({ minAmount: "1.0" })).success).toBe(
      false,
    );
    expect(
      createExpenseFilterSchema("KWD").safeParse(values({ maxAmount: "1.0001" })).success,
    ).toBe(false);
  });
});
