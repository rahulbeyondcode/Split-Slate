import { describe, expect, it } from "vitest";

import { calculateGroupTotal, calculateMemberNet } from "@/shared/utils/balances";

import type { Expense, Transaction } from "@/shared/types/domain.types";

interface ExpenseData {
  id: string;
  paid: Transaction[];
  owes: Transaction[];
}

const createExpense = ({ id, paid, owes }: ExpenseData): Expense => ({
  expenseId: id,
  groupId: "group-1",
  expenseName: id,
  createdBy: paid[0]?.memberId ?? "member-a",
  categoryId: "category-1",
  createdAt: 1,
  when: 1,
  splitType: "equal",
  splitMeta: [],
  transactions: { paid, owes },
  tagIds: [],
  attachmentIds: [],
});

const EXPENSES: Expense[] = [
  createExpense({
    id: "dinner",
    paid: [{ memberId: "member-a", amount: 10_000 }],
    owes: [
      { memberId: "member-a", amount: 2_500 },
      { memberId: "member-b", amount: 2_500 },
      { memberId: "member-c", amount: 5_000 },
    ],
  }),
  createExpense({
    id: "taxi",
    paid: [
      { memberId: "member-a", amount: 1_000 },
      { memberId: "member-b", amount: 3_000 },
    ],
    owes: [
      { memberId: "member-a", amount: 2_000 },
      { memberId: "member-b", amount: 2_000 },
    ],
  }),
];

describe("calculateMemberNet", () => {
  it("returns zero when there are no expenses", () => {
    expect(calculateMemberNet([], "member-a")).toBe(0);
  });

  it("subtracts everything a member owes from everything they paid", () => {
    expect(calculateMemberNet(EXPENSES, "member-a")).toBe(6_500);
    expect(calculateMemberNet(EXPENSES, "member-b")).toBe(-1_500);
    expect(calculateMemberNet(EXPENSES, "member-c")).toBe(-5_000);
  });

  it("ignores transactions assigned to other members", () => {
    expect(calculateMemberNet(EXPENSES, "member-d")).toBe(0);
  });
});

describe("calculateGroupTotal", () => {
  it("returns zero when there are no expenses", () => {
    expect(calculateGroupTotal([])).toBe(0);
  });

  it("sums every payer contribution across all expenses", () => {
    expect(calculateGroupTotal(EXPENSES)).toBe(14_000);
  });
});
