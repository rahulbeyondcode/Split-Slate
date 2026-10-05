import { describe, expect, it } from "vitest";

import { categorySpending } from "@/shared/utils/category-spending";

import type { Category, Expense } from "@/shared/types/domain.types";

const categories: Category[] = [
  { id: "food", groupId: "trip", name: "Food", icon: "🍽️", isActive: true },
  { id: "dining", groupId: "other", name: "Food", icon: "🍔", isActive: true },
  { id: "travel", groupId: "trip", name: "Travel", icon: "🚕", isActive: false },
];

const expense = (id: string, categoryId: string, paid: number[]): Expense => ({
  expenseId: id,
  groupId: "trip",
  expenseName: id,
  categoryId,
  createdBy: "self",
  createdAt: 1,
  when: 1,
  splitType: "equal",
  splitMeta: [],
  tagIds: [],
  attachmentIds: [],
  transactions: {
    paid: paid.map((amount, index) => ({ memberId: `payer-${index}`, amount })),
    owes: [{ memberId: "self", amount: paid.reduce((sum, amount) => sum + amount, 0) }],
  },
});

describe("category spending", () => {
  it("returns no rows without expenses, even when categories exist", () => {
    expect(categorySpending([], categories)).toEqual([]);
  });

  it("sums every payer, combines matching names, and orders by spending", () => {
    const expenses = [
      expense("ride", "travel", [1_500, 500]),
      expense("dinner", "food", [1_000, 2_000]),
      expense("lunch", "dining", [1_000]),
    ];
    expect(categorySpending(expenses, categories)).toEqual([
      { name: "Food", icon: "🍔", amount: 4_000 },
      { name: "Travel", icon: "🚕", amount: 2_000 },
    ]);
    expect(expenses.map((item) => item.expenseId)).toEqual(["ride", "dinner", "lunch"]);
  });

  it("keeps historical inactive categories and groups missing references under Other", () => {
    expect(
      categorySpending(
        [expense("ride", "travel", [1_000]), expense("legacy", "missing", [500])],
        categories,
      ),
    ).toEqual([
      { name: "Travel", icon: "🚕", amount: 1_000 },
      { name: "Other", icon: "✦", amount: 500 },
    ]);
  });
});
