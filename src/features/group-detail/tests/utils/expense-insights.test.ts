import { describe, expect, it } from "vitest";

import { calculateExpenseInsights } from "@/features/group-detail/utils/expense-insights";

import type { GroupMemberWithPerson } from "@/features/group-detail/types/group-detail.types";
import type { Category, Expense } from "@/shared/types/domain.types";

const members: GroupMemberWithPerson[] = [
  { id: "a", groupId: "trip", personId: "amy" },
  { id: "b", groupId: "trip", personId: "bea" },
  { id: "c", groupId: "trip", personId: "cal" },
];
const categories: Category[] = [
  { id: "food", groupId: "trip", name: "Food", icon: "", isActive: true },
  { id: "travel", groupId: "trip", name: "Travel", icon: "", isActive: true },
];

const expense = (
  id: string,
  categoryId: string,
  paid: Expense["transactions"]["paid"],
  owes: Expense["transactions"]["owes"],
): Expense => ({
  expenseId: id,
  groupId: "trip",
  expenseName: id,
  categoryId,
  createdBy: "a",
  createdAt: 1,
  when: 1,
  splitType: "equal",
  splitMeta: [],
  tagIds: [],
  attachmentIds: [],
  transactions: { paid, owes },
});

const dinner = expense(
  "dinner",
  "food",
  [{ memberId: "a", amount: 10001 }],
  [
    { memberId: "a", amount: 3335 },
    { memberId: "b", amount: 3333 },
    { memberId: "c", amount: 3333 },
  ],
);
const taxi = expense(
  "taxi",
  "travel",
  [{ memberId: "b", amount: 5000 }],
  [
    { memberId: "a", amount: 2500 },
    { memberId: "b", amount: 2500 },
  ],
);
const hotel = expense(
  "hotel",
  "travel",
  [
    { memberId: "a", amount: 10000 },
    { memberId: "b", amount: 10000 },
  ],
  [
    { memberId: "a", amount: 10000 },
    { memberId: "b", amount: 10000 },
  ],
);

describe("expense insights", () => {
  it("totals multi-payer allocations, shares, rounded averages, and categories", () => {
    const result = calculateExpenseInsights([dinner, taxi, hotel], members, categories);
    expect(result.total).toBe(35001);
    expect(result.average).toBe(11667);
    expect(result.topCategory).toEqual({ id: "travel", name: "Travel", amount: 25000 });
    expect(result.members).toEqual([
      { memberId: "a", paid: 20001, owed: 15835, net: 4166 },
      { memberId: "b", paid: 15000, owed: 15833, net: -833 },
      { memberId: "c", paid: 0, owed: 3333, net: -3333 },
    ]);
  });

  it("uses only matching expenses and keeps an empty result at zero", () => {
    const onlyDinner = calculateExpenseInsights([dinner], members, categories);
    expect(onlyDinner.total).toBe(10001);
    expect(onlyDinner.members.map(({ net }) => net)).toEqual([6666, -3333, -3333]);

    const empty = calculateExpenseInsights([], members, categories);
    expect(empty.total).toBe(0);
    expect(empty.average).toBe(0);
    expect(empty.topCategory).toBeNull();
    expect(
      empty.members.every(({ paid, owed, net }) => paid === 0 && owed === 0 && net === 0),
    ).toBe(true);
  });

  it("rejects a missing member rather than showing incomplete totals", () => {
    expect(() => calculateExpenseInsights([dinner], members.slice(0, 2), categories)).toThrow(
      "missing member",
    );
  });
});
