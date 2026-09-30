import { describe, expect, it } from "vitest";

import {
  countActiveExpenseFilters,
  createExpenseFilterDefaults,
  createExpenseFilterSchema,
  filterExpenses,
  pruneUnavailableExpenseFilterOptions,
  readExpenseFilterParams,
  sortExpenses,
  writeExpenseFilterParams,
} from "@/features/expenses/utils/expense-filters";

import type { ExpenseFilterValues } from "@/features/expenses/types/expense-filters.types";
import type { Category, Expense, Tag } from "@/shared/types/domain.types";

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
  it("round-trips text, dates, amounts, and repeated option IDs through the URL", () => {
    const selected = values({
      name: "  dinner ",
      dateFrom: "2026-09-20",
      dateTo: "2026-09-21",
      categoryIds: ["food", "travel"],
      tagIds: ["holiday"],
      payerIds: ["b"],
      memberIds: ["a"],
      splitTypes: ["equal", "shares"],
      minAmount: "12.50",
      maxAmount: "100.00",
      sort: "highest",
    });
    const params = writeExpenseFilterParams(selected);
    expect(params.getAll("categoryIds")).toEqual(["food", "travel"]);
    expect(params.get("sort")).toBe("highest");
    expect(readExpenseFilterParams(params)).toEqual(selected);
    expect(writeExpenseFilterParams(createExpenseFilterDefaults()).toString()).toBe("");
  });

  it("ignores unknown URL fields and invalid or duplicate split options", () => {
    const params = new URLSearchParams(
      "memberIds=a&memberIds=a&splitTypes=other&splitTypes=equal&splitTypes=equal&unused=1",
    );
    expect(readExpenseFilterParams(params)).toEqual(
      values({ memberIds: ["a"], splitTypes: ["equal"] }),
    );
  });

  it("defaults unknown sorts to newest and omits the default from the URL", () => {
    expect(readExpenseFilterParams(new URLSearchParams("sort=unexpected"))).toEqual(values());
    expect(writeExpenseFilterParams(values({ sort: "newest" })).toString()).toBe("");
  });

  it.each(["name-asc", "name-desc", "category", "tags"] as const)(
    "round-trips and validates the %s sort mode",
    (sort) => {
      const selected = values({ sort });
      expect(readExpenseFilterParams(writeExpenseFilterParams(selected))).toEqual(selected);
      expect(createExpenseFilterSchema("INR").safeParse(selected).success).toBe(true);
    },
  );

  it("sorts by date or the sum of all payer amounts without changing the source", () => {
    const older = expense({ expenseId: "older", when: 1 });
    const cheaper = expense({
      expenseId: "cheaper",
      when: 3,
      transactions: { paid: [{ memberId: "a", amount: 200 }], owes: [] },
    });
    const latest = expense({ expenseId: "latest", when: 4 });
    const source = [older, cheaper, latest];
    expect(sortExpenses(source, "newest")).toEqual([latest, cheaper, older]);
    expect(sortExpenses(source, "oldest")).toEqual([older, cheaper, latest]);
    expect(sortExpenses(source, "highest")).toEqual([latest, older, cheaper]);
    expect(sortExpenses(source, "lowest")).toEqual([cheaper, latest, older]);
    expect(source).toEqual([older, cheaper, latest]);
  });

  it("sorts names case-insensitively, breaking matching-name ties by newest date", () => {
    const source = [
      expense({ expenseId: "z", expenseName: "Zoo", when: 6 }),
      expense({ expenseId: "older", expenseName: "apple", when: 1 }),
      expense({ expenseId: "newer", expenseName: "Apple", when: 5 }),
    ];
    expect(sortExpenses(source, "name-asc").map((item) => item.expenseId)).toEqual([
      "newer",
      "older",
      "z",
    ]);
    expect(sortExpenses(source, "name-desc").map((item) => item.expenseId)).toEqual([
      "z",
      "newer",
      "older",
    ]);
  });

  it("keeps identical categories together by name, newest within each category", () => {
    const categories = [
      { id: "travel", groupId: "trip", name: "Travel", icon: "🚕", isActive: true },
      { id: "food", groupId: "trip", name: "Food", icon: "🍽️", isActive: true },
    ] satisfies Category[];
    const source = [
      expense({ expenseId: "travel-old", categoryId: "travel", when: 1 }),
      expense({ expenseId: "unknown", categoryId: "missing", when: 10 }),
      expense({ expenseId: "food", categoryId: "food", when: 2 }),
      expense({ expenseId: "travel-new", categoryId: "travel", when: 3 }),
    ];
    expect(sortExpenses(source, "category", categories).map((item) => item.expenseId)).toEqual([
      "food",
      "travel-new",
      "travel-old",
      "unknown",
    ]);
  });

  it("groups identical tag sets regardless of ID order, without duplicating expenses", () => {
    const tags = [
      { id: "work", groupId: "trip", name: "Work", color: "#123456" },
      { id: "holiday", groupId: "trip", name: "Holiday", color: "#654321" },
    ] satisfies Tag[];
    const source = [
      expense({ expenseId: "combo-old", tagIds: ["work", "holiday"], when: 1 }),
      expense({ expenseId: "untagged", tagIds: [], when: 10 }),
      expense({ expenseId: "work", tagIds: ["work"], when: 6 }),
      expense({ expenseId: "combo-new", tagIds: ["holiday", "work"], when: 7 }),
      expense({ expenseId: "holiday", tagIds: ["holiday"], when: 2 }),
    ];
    expect(sortExpenses(source, "tags", [], tags).map((item) => item.expenseId)).toEqual([
      "holiday",
      "combo-new",
      "combo-old",
      "work",
      "untagged",
    ]);
    expect(source).toHaveLength(5);
  });

  it("includes creator-only references when filtering by involved member", () => {
    const recorded = expense({
      createdBy: "c",
      transactions: {
        paid: [{ memberId: "a", amount: 100 }],
        owes: [{ memberId: "b", amount: 100 }],
      },
    });
    expect(filterExpenses([recorded], values({ memberIds: ["c"] }), "INR")).toEqual([recorded]);
    expect(filterExpenses([recorded], values({ payerIds: ["c"] }), "INR")).toEqual([]);
  });

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
    ["JPY", "100.01"],
    ["KWD", "100.01"],
  ])("filters using fixed hundredths in %s", (currency, amount) => {
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

  it("rejects more than two decimals for every currency", () => {
    expect(createExpenseFilterSchema("JPY").safeParse(values({ minAmount: "1.0" })).success).toBe(
      true,
    );
    expect(createExpenseFilterSchema("JPY").safeParse(values({ minAmount: "1.001" })).success).toBe(
      false,
    );
    expect(createExpenseFilterSchema("KWD").safeParse(values({ maxAmount: "1.001" })).success).toBe(
      false,
    );
  });
});
