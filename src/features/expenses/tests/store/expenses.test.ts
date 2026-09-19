import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/configs/db";
import { useStore } from "@/shared/configs/store";

import type { CreateExpenseInput } from "@/features/expenses/types/expenses.types";

const input = (): CreateExpenseInput => ({
  groupId: "g",
  currency: "INR",
  values: {
    expenseName: " Lunch ",
    amount: "100.01",
    when: "2026-09-19T12:30",
    categoryId: "food",
    tagIds: ["trip"],
    payerMode: "single",
    payerId: "a",
    payers: [],
    splitType: "equal",
    participants: [
      { memberId: "a", selected: true, value: "" },
      { memberId: "b", selected: true, value: "" },
    ],
  },
});

beforeEach(async () => {
  await db.delete();
  await db.open();
  useStore.setState(useStore.getInitialState(), true);
  await db.localUser.add({ id: "self", name: "Amy", icon: "🦊" });
  await db.people.bulkAdd([
    { id: "self", name: "Amy", icon: "🦊" },
    { id: "friend", name: "Bea", icon: "🐻" },
  ]);
  await db.groups.add({
    id: "g",
    name: "Trip",
    icon: "🏕️",
    currency: "INR",
    createdAt: 1,
    frequentPayerIds: ["a"],
  });
  await db.members.bulkAdd([
    { id: "a", personId: "self", groupId: "g" },
    { id: "b", personId: "friend", groupId: "g" },
  ]);
  await db.categories.add({ id: "food", groupId: "g", name: "Food", icon: "🍽️", isActive: true });
  await db.tags.add({ id: "trip", groupId: "g", name: "Trip", color: "#123456" });
  await useStore.getState().init();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});

describe("addExpense", () => {
  it("persists a balanced expense, updates state, and survives hydration", async () => {
    const expense = await useStore.getState().addExpense(input());
    expect(expense.expenseName).toBe("Lunch");
    expect(expense.expenseId).toMatch(/^[0-9a-f-]{36}$/);
    expect(expense.createdBy).toBe("a");
    expect(expense.transactions).toEqual({
      paid: [{ memberId: "a", amount: 10001 }],
      owes: [
        { memberId: "a", amount: 5001 },
        { memberId: "b", amount: 5000 },
      ],
    });
    expect(expense.tagIds).toEqual(["trip"]);
    expect(await db.expenses.get(expense.expenseId)).toEqual(expense);
    expect(useStore.getState().expenses).toEqual([expense]);
    useStore.setState({ expenses: [] });
    await useStore.getState().init();
    expect(useStore.getState().expenses).toEqual([expense]);
  });
  it("commits payer rankings with the expense", async () => {
    const data = input();
    data.values.payerId = "b";
    await useStore.getState().addExpense(data);
    expect((await db.groups.get("g"))?.frequentPayerIds).toEqual(["b", "a"]);
    expect(useStore.getState().groups[0].frequentPayerIds).toEqual(["b", "a"]);
  });
  it.each(["amount", "shares", "percentage", "adjustment"] as const)(
    "persists %s split metadata and exact totals",
    async (method) => {
      const data = input();
      data.values.splitType = method;
      data.values.participants[0].value =
        method === "shares" ? "1" : method === "percentage" ? "40" : "10";
      data.values.participants[1].value =
        method === "shares" ? "2" : method === "percentage" ? "60" : "";
      const expense = await useStore.getState().addExpense(data);
      expect(expense.transactions.owes.reduce((sum, row) => sum + row.amount, 0)).toBe(10001);
      expect(expense.splitMeta).toHaveLength(method === "amount" ? 0 : 2);
      expect(await db.expenses.get(expense.expenseId)).toEqual(expense);
    },
  );
  it.each([
    [
      "missing group",
      async () => {
        await db.groups.delete("g");
      },
    ],
    [
      "changed currency",
      async () => {
        await db.groups.update("g", { currency: "JPY" });
      },
    ],
    [
      "inactive category",
      async () => {
        await db.categories.update("food", { isActive: false });
      },
    ],
    [
      "foreign category",
      async () => {
        await db.categories.update("food", { groupId: "other" });
      },
    ],
    [
      "deleted category",
      async () => {
        await db.categories.delete("food");
      },
    ],
    [
      "foreign tag",
      async () => {
        await db.tags.update("trip", { groupId: "other" });
      },
    ],
    [
      "deleted tag",
      async () => {
        await db.tags.delete("trip");
      },
    ],
    [
      "foreign participant",
      async () => {
        await db.members.update("b", { groupId: "other" });
      },
    ],
    [
      "missing creator",
      async () => {
        await db.members.delete("a");
      },
    ],
    [
      "missing person",
      async () => {
        await db.people.delete("friend");
      },
    ],
  ] as const)(
    "rejects %s using persisted references despite stale client state",
    async (_, mutate) => {
      await mutate();
      await expect(useStore.getState().addExpense(input())).rejects.toThrow();
      expect(await db.expenses.count()).toBe(0);
      expect(useStore.getState().expenses).toEqual([]);
    },
  );
  it("rejects a foreign payer", async () => {
    const data = input();
    data.values.payerId = "elsewhere";
    await expect(useStore.getState().addExpense(data)).rejects.toThrow("belong to this group");
  });
  it("rejects mismatched multi-payer totals before writing", async () => {
    const data = input();
    data.values.payerMode = "multiple";
    data.values.payers = [{ memberId: "a", amount: "100" }];
    await expect(useStore.getState().addExpense(data)).rejects.toThrow("add up");
    expect(await db.expenses.count()).toBe(0);
  });
  it("rolls back the expense if the ranking write fails and allows retry", async () => {
    const previous = useStore.getState().groups;
    const failure = vi.spyOn(db.groups, "update").mockRejectedValueOnce(new Error("Disk full"));
    await expect(useStore.getState().addExpense(input())).rejects.toThrow("Disk full");
    expect(await db.expenses.count()).toBe(0);
    expect(useStore.getState().expenses).toEqual([]);
    expect(useStore.getState().groups).toEqual(previous);
    expect((await db.groups.get("g"))?.frequentPayerIds).toEqual(["a"]);
    failure.mockRestore();
    await useStore.getState().addExpense(input());
    expect(await db.expenses.count()).toBe(1);
  });
  it("does not update state when the expense write fails", async () => {
    vi.spyOn(db.expenses, "add").mockRejectedValueOnce(new Error("Write failed"));
    await expect(useStore.getState().addExpense(input())).rejects.toThrow("Write failed");
    expect(useStore.getState().expenses).toEqual([]);
    expect(await db.expenses.count()).toBe(0);
  });
  it("serializes simultaneous saves without losing history or rankings", async () => {
    const second = input();
    second.values.payerId = "b";
    const result = await Promise.all([
      useStore.getState().addExpense(input()),
      useStore.getState().addExpense(second),
    ]);
    expect(new Set(result.map((expense) => expense.expenseId)).size).toBe(2);
    expect(await db.expenses.count()).toBe(2);
    expect(useStore.getState().expenses).toHaveLength(2);
    expect((await db.groups.get("g"))?.frequentPayerIds).toEqual(["a", "b"]);
  });
});
