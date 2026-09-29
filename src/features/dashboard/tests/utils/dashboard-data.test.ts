import { describe, expect, it } from "vitest";

import { dashboardActivity } from "@/features/dashboard/utils/dashboard-data";
import { useStore } from "@/shared/configs/store";

import type { Expense } from "@/shared/types/domain.types";

const expense = (expenseId: string, groupId: string, createdAt: number, when: number): Expense => ({
  expenseId,
  groupId,
  expenseName: expenseId,
  categoryId: "food",
  createdBy: "member",
  createdAt,
  when,
  splitType: "equal",
  splitMeta: [],
  tagIds: [],
  attachmentIds: [],
  transactions: {
    paid: [{ memberId: "member", amount: 1000 }],
    owes: [{ memberId: "member", amount: 1000 }],
  },
});

describe("dashboard activity", () => {
  const state = {
    ...useStore.getState(),
    groups: [
      {
        id: "first",
        name: "First Trip",
        icon: "🏕️",
        currency: "INR",
        createdAt: 1,
        frequentPayerIds: [],
      },
      {
        id: "second",
        name: "Second Trip",
        icon: "🏖️",
        currency: "INR",
        createdAt: 2,
        frequentPayerIds: [],
      },
    ],
    members: [{ id: "member", groupId: "first", personId: "self" }],
    people: [{ id: "self", name: "Amy", icon: "🦊" }],
    localUser: { id: "self", name: "Amy", icon: "🦊" },
    categories: [{ id: "food", groupId: "first", name: "Food", icon: "🍽️", isActive: true }],
    expenses: [
      expense("old-first", "first", 1, 900),
      expense("new-second", "second", 3, 100),
      expense("new-first", "first", 2, 800),
    ],
  };

  it("interleaves all groups by recording time rather than expense date", () => {
    expect(dashboardActivity(state).map(({ expense: item }) => item.expenseId)).toEqual([
      "new-second",
      "new-first",
      "old-first",
    ]);
    expect(dashboardActivity(state)[0].group?.name).toBe("Second Trip");
    expect(state.expenses.map((item) => item.expenseId)).toEqual([
      "old-first",
      "new-second",
      "new-first",
    ]);
  });

  it("shows only the current group's activity in recording order", () => {
    expect(dashboardActivity(state, "first").map(({ expense: item }) => item.expenseId)).toEqual([
      "new-first",
      "old-first",
    ]);
    expect(dashboardActivity(state, "second").map(({ expense: item }) => item.expenseId)).toEqual([
      "new-second",
    ]);
    expect(dashboardActivity(state, "empty")).toEqual([]);
  });
});
