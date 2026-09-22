import { describe, expect, it } from "vitest";

import {
  expenseFormMembers,
  expenseFormValues,
  localDateTime,
} from "@/features/expenses/utils/expense-form-values";
import { expenseTransactions } from "@/features/expenses/utils/expense-schema";
import { moneyToDecimal } from "@/shared/utils/money";

import type { Expense, SplitMeta, Transaction } from "@/shared/types/domain.types";

const members = [
  { id: "a", name: "Amy" },
  { id: "b", name: "Bea" },
  { id: "c", name: "Cal" },
];
const saved = (
  splitType: Expense["splitType"],
  owes: Transaction[],
  splitMeta: SplitMeta[] = [],
): Expense => ({
  expenseId: "expense",
  groupId: "group",
  expenseName: "Dinner",
  createdAt: 1,
  createdBy: "a",
  categoryId: "food",
  tagIds: ["holiday"],
  attachmentIds: ["receipt"],
  when: new Date(2026, 8, 20, 18, 30).getTime(),
  splitType,
  splitMeta,
  transactions: {
    paid: [
      { memberId: "b", amount: 4000 },
      { memberId: "a", amount: 6001 },
    ],
    owes,
  },
});

describe("expenseFormValues", () => {
  it.each([
    ["equal", [5000, 5001], []],
    ["amount", [0, 10001], []],
    ["shares", [6667, 3334], [2, 1]],
    ["percentage", [7001, 3000], [70, 30]],
    ["adjustment", [6000, 4001], [1000, -1000]],
  ] as const)(
    "round-trips %s allocations, metadata, and payer order",
    (method, amounts, metadata) => {
      const expense = saved(
        method,
        [
          { memberId: "b", amount: amounts[0] },
          { memberId: "a", amount: amounts[1] },
        ],
        metadata.map((value, index) => ({ memberId: index === 0 ? "b" : "a", value })),
      );
      const values = expenseFormValues(expense, members, "INR");
      expect(expenseTransactions(values, "INR")).toEqual({
        transactions: expense.transactions,
        splitMeta: expense.splitMeta,
      });
      expect(values.participants.map((row) => [row.memberId, row.selected])).toEqual([
        ["b", true],
        ["a", true],
        ["c", false],
      ]);
      expect(values.tagIds).toEqual(["holiday"]);
      expect(expenseFormMembers(members, expense).map((member) => member.id)).toEqual([
        "b",
        "a",
        "c",
      ]);
    },
  );
  it.each(["JPY", "INR", "KWD"])("keeps exact maximum amounts in %s", (currency) => {
    const expense = saved("amount", [{ memberId: "a", amount: Number.MAX_SAFE_INTEGER }]);
    expense.transactions.paid = [{ memberId: "a", amount: Number.MAX_SAFE_INTEGER }];
    const values = expenseFormValues(expense, members, currency);
    expect(values.amount).toBe(moneyToDecimal(Number.MAX_SAFE_INTEGER, currency));
    expect(values.payerMode).toBe("single");
    expect(expenseTransactions(values, currency).transactions).toEqual(expense.transactions);
  });
  it("preserves six-decimal ratios", () => {
    const expense = saved(
      "shares",
      [
        { memberId: "a", amount: 10001 },
        { memberId: "b", amount: 0 },
      ],
      [
        { memberId: "a", value: 1.234567 },
        { memberId: "b", value: 0.000001 },
      ],
    );
    expect(
      expenseTransactions(expenseFormValues(expense, members, "INR"), "INR").splitMeta,
    ).toEqual(expense.splitMeta);
  });
});

describe("localDateTime", () => {
  it("formats the local wall time with zero-padded fields", () => {
    expect(localDateTime(new Date(2026, 0, 2, 3, 4, 59).getTime())).toBe("2026-01-02T03:04");
  });
});
