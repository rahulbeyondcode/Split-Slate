import { describe, expect, it } from "vitest";

import {
  expenseFormMembers,
  expenseFormValues,
  localDateTime,
} from "@/features/expenses/utils/expense-form-values";
import { createExpenseSchema, expenseTransactions } from "@/features/expenses/utils/expense-schema";
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
    ["shares", [6667, 3334], ["2", "1"]],
    ["percentage", [7001, 3000], ["70", "30"]],
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
        { memberId: "a", value: "1.234567" },
        { memberId: "b", value: "0.000001" },
      ],
    );
    expect(
      expenseTransactions(expenseFormValues(expense, members, "INR"), "INR").splitMeta,
    ).toEqual(expense.splitMeta);
  });
  it("round-trips maximum shares with a maximum total and preserves every minor unit", () => {
    const expense = saved(
      "shares",
      [
        { memberId: "a", amount: Number.MAX_SAFE_INTEGER - 1 },
        { memberId: "b", amount: 1 },
      ],
      [
        { memberId: "a", value: "9007199254.740991" },
        { memberId: "b", value: "0.000001" },
      ],
    );
    expense.transactions.paid = [{ memberId: "a", amount: Number.MAX_SAFE_INTEGER }];
    const values = expenseFormValues(expense, members, "INR");
    expect(createExpenseSchema("INR").safeParse(values).success).toBe(true);
    expect(expenseTransactions(values, "INR")).toEqual({
      transactions: expense.transactions,
      splitMeta: expense.splitMeta,
    });
  });
  it.each([
    ["shares", [2, 1], [6667, 3334]],
    ["percentage", [70, 30], [7001, 3000]],
  ] as const)(
    "reads legacy numeric %s metadata and writes exact text",
    (method, metadata, amounts) => {
      const expense = saved(
        method,
        [
          { memberId: "a", amount: amounts[0] },
          { memberId: "b", amount: amounts[1] },
        ],
        metadata.map((value, index) => ({ memberId: index === 0 ? "a" : "b", value })),
      );
      const values = expenseFormValues(expense, members, "INR");
      expect(values.participants.slice(0, 2).map((row) => row.value)).toEqual(metadata.map(String));
      const result = expenseTransactions(values, "INR");
      expect(result.transactions).toEqual(expense.transactions);
      expect(result.splitMeta.map((row) => row.value)).toEqual(metadata.map(String));
      expect(expense.splitMeta.map((row) => row.value)).toEqual(metadata);
    },
  );
  it("does not silently clamp a legacy ratio whose precision was already lost", () => {
    const expense = saved(
      "shares",
      [{ memberId: "a", amount: 10001 }],
      [{ memberId: "a", value: 9007199254.740992 }],
    );
    const values = expenseFormValues(expense, members, "INR");
    expect(values.participants[0].value).toBe("9007199254.740992");
    expect(createExpenseSchema("INR").safeParse(values).success).toBe(false);
    expect(expense.splitMeta[0].value).toBe(9007199254.740992);
  });
});

describe("localDateTime", () => {
  it("formats the local wall time with zero-padded fields", () => {
    expect(localDateTime(new Date(2026, 0, 2, 3, 4, 59).getTime())).toBe("2026-01-02T03:04");
  });
});
