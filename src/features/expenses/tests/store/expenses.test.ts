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

describe("updateExpense", () => {
  it("updates editable fields, preserves identity and attachments, and survives hydration", async () => {
    const original = await useStore.getState().addExpense(input());
    const preciseWhen = original.when + 12345;
    await db.expenses.update(original.expenseId, { attachmentIds: ["receipt"], when: preciseWhen });
    const data = input();
    data.values.expenseName = " Updated lunch ";
    data.values.amount = "125.50";
    data.values.payerId = "b";
    data.values.tagIds = [];
    data.values.participants[0].selected = false;
    const updated = await useStore.getState().updateExpense(original.expenseId, data);
    expect(updated).toMatchObject({
      expenseId: original.expenseId,
      createdAt: original.createdAt,
      createdBy: original.createdBy,
      groupId: "g",
      when: preciseWhen,
      attachmentIds: ["receipt"],
      expenseName: "Updated lunch",
      tagIds: [],
      transactions: {
        paid: [{ memberId: "b", amount: 12550 }],
        owes: [{ memberId: "b", amount: 12550 }],
      },
    });
    expect(await db.expenses.count()).toBe(1);
    expect(await db.expenses.get(original.expenseId)).toEqual(updated);
    expect((await db.groups.get("g"))?.frequentPayerIds).toEqual(["b", "a"]);
    useStore.setState({ expenses: [] });
    await useStore.getState().init();
    expect(useStore.getState().expenses).toEqual([updated]);
  });
  it.each(["amount", "shares", "percentage", "adjustment"] as const)(
    "recalculates a changed %s split",
    async (method) => {
      const original = await useStore.getState().addExpense(input());
      const data = input();
      data.values.splitType = method;
      data.values.participants[0].value =
        method === "shares" ? "1" : method === "percentage" ? "40" : "10";
      data.values.participants[1].value =
        method === "shares" ? "2" : method === "percentage" ? "60" : "";
      data.values.when = "2026-09-20T15:00";
      const updated = await useStore.getState().updateExpense(original.expenseId, data);
      expect(updated.splitType).toBe(method);
      expect(updated.transactions.owes.reduce((sum, row) => sum + row.amount, 0)).toBe(10001);
      expect(updated.when).toBe(new Date("2026-09-20T15:00").getTime());
      expect(updated.splitMeta).toHaveLength(method === "amount" ? 0 : 2);
    },
  );
  it("retains the current inactive category but rejects switching to another inactive category", async () => {
    const original = await useStore.getState().addExpense(input());
    await db.categories.update("food", { isActive: false });
    await useStore.getState().updateExpense(original.expenseId, input());
    await db.categories.add({
      id: "other",
      groupId: "g",
      name: "Other",
      icon: "📦",
      isActive: false,
    });
    const data = input();
    data.values.categoryId = "other";
    await expect(useStore.getState().updateExpense(original.expenseId, data)).rejects.toThrow(
      "active category",
    );
    expect((await db.expenses.get(original.expenseId))?.categoryId).toBe("food");
  });
  it.each(["group", "member", "person", "category", "tag", "currency"])(
    "rejects a stale %s reference without changing the expense",
    async (missing) => {
      const original = await useStore.getState().addExpense(input());
      if (missing === "group") await db.groups.delete("g");
      if (missing === "member") await db.members.delete("b");
      if (missing === "person") await db.people.delete("friend");
      if (missing === "category") await db.categories.delete("food");
      if (missing === "tag") await db.tags.delete("trip");
      if (missing === "currency") await db.groups.update("g", { currency: "JPY" });
      await expect(
        useStore.getState().updateExpense(original.expenseId, input()),
      ).rejects.toThrow();
      expect(await db.expenses.get(original.expenseId)).toEqual(original);
      expect(useStore.getState().expenses).toEqual([original]);
    },
  );
  it("rejects missing and cross-group expense IDs", async () => {
    const original = await useStore.getState().addExpense(input());
    await expect(useStore.getState().updateExpense("missing", input())).rejects.toThrow(
      "not found",
    );
    await expect(
      useStore.getState().updateExpense(original.expenseId, { ...input(), groupId: "other" }),
    ).rejects.toThrow("not found");
    expect(await db.expenses.get(original.expenseId)).toEqual(original);
  });
  it("rejects an invalid total without altering saved data", async () => {
    const original = await useStore.getState().addExpense(input());
    const data = input();
    data.values.amount = "0";
    await expect(useStore.getState().updateExpense(original.expenseId, data)).rejects.toThrow(
      "greater than zero",
    );
    expect(await db.expenses.get(original.expenseId)).toEqual(original);
  });
  it.each(["expense", "ranking"])(
    "rolls back when the %s write fails, then allows retry",
    async (failure) => {
      const original = await useStore.getState().addExpense(input());
      const previousGroups = useStore.getState().groups;
      const data = input();
      data.values.payerId = "b";
      if (failure === "expense")
        vi.spyOn(db.expenses, "put").mockRejectedValueOnce(new Error("Disk full"));
      else vi.spyOn(db.groups, "update").mockRejectedValueOnce(new Error("Disk full"));
      await expect(useStore.getState().updateExpense(original.expenseId, data)).rejects.toThrow(
        "Disk full",
      );
      expect(await db.expenses.get(original.expenseId)).toEqual(original);
      expect(useStore.getState().expenses).toEqual([original]);
      expect(useStore.getState().groups).toEqual(previousGroups);
      expect(await db.groups.toArray()).toEqual(previousGroups);
      await useStore.getState().updateExpense(original.expenseId, data);
      expect((await db.expenses.get(original.expenseId))?.transactions.paid[0].memberId).toBe("b");
    },
  );
  it("replaces the old total when checking aggregate limits and rejects one minor unit over", async () => {
    const data = input();
    data.values.amount = "90071992547409.90";
    const original = await useStore.getState().addExpense(data);
    data.values.amount = "90071992547409.91";
    const updated = await useStore.getState().updateExpense(original.expenseId, data);
    expect(updated.transactions.paid[0].amount).toBe(Number.MAX_SAFE_INTEGER);
    const small = input();
    small.values.amount = "0.01";
    await expect(useStore.getState().addExpense(small)).rejects.toThrow("supported total");
    data.values.amount = "90071992547409.90";
    await useStore.getState().updateExpense(original.expenseId, data);
    await useStore.getState().addExpense(small);
    data.values.amount = "90071992547409.91";
    await expect(useStore.getState().updateExpense(original.expenseId, data)).rejects.toThrow(
      "supported total",
    );
    expect((await db.expenses.get(original.expenseId))?.transactions.paid[0].amount).toBe(
      Number.MAX_SAFE_INTEGER - 1,
    );
  });
  it("serializes concurrent updates without duplicate records", async () => {
    const original = await useStore.getState().addExpense(input());
    const changed = input();
    changed.values.payerId = "b";
    await Promise.all([
      useStore.getState().updateExpense(original.expenseId, input()),
      useStore.getState().updateExpense(original.expenseId, changed),
    ]);
    expect(await db.expenses.count()).toBe(1);
    expect(useStore.getState().expenses).toEqual(await db.expenses.toArray());
    expect(useStore.getState().groups).toEqual(await db.groups.toArray());
  });
});

const addReceipts = async (expenseId: string) => {
  await db.attachments.bulkAdd([
    { id: "receipt", expenseId, blob: new Blob(["receipt"]), mimeType: "image/png", createdAt: 1 },
    {
      id: "unlisted",
      expenseId,
      blob: new Blob(["unlisted"]),
      mimeType: "image/png",
      createdAt: 1,
    },
    {
      id: "unrelated",
      expenseId: "other",
      blob: new Blob(["other"]),
      mimeType: "image/png",
      createdAt: 1,
    },
  ]);
  await db.expenses.update(expenseId, { attachmentIds: ["receipt"] });
  await useStore.getState().init();
};

describe("removeExpense", () => {
  it("deletes owned receipts including unlisted ones, preserves unrelated data, and recalculates rankings", async () => {
    const data = input();
    data.values.payerId = "b";
    const original = await useStore.getState().addExpense(data);
    await addReceipts(original.expenseId);
    await useStore.getState().removeExpense(original.expenseId, "g");
    expect(await db.expenses.count()).toBe(0);
    expect(useStore.getState().expenses).toEqual([]);
    expect((await db.attachments.toArray()).map((row) => row.id)).toEqual(["unrelated"]);
    expect((await db.groups.get("g"))?.frequentPayerIds).toEqual(["a", "b"]);
    expect(useStore.getState().groups[0].frequentPayerIds).toEqual(["a", "b"]);
    await useStore.getState().init();
    expect(useStore.getState().expenses).toEqual([]);
  });
  it.each(["expense", "ranking", "attachments"])(
    "rolls back all deletion when the %s operation fails",
    async (failure) => {
      const original = await useStore.getState().addExpense(input());
      await addReceipts(original.expenseId);
      const previous = await db.expenses.get(original.expenseId);
      const groups = await db.groups.toArray();
      if (failure === "expense")
        vi.spyOn(db.expenses, "delete").mockRejectedValueOnce(new Error("Disk error"));
      else if (failure === "ranking")
        vi.spyOn(db.groups, "update").mockRejectedValueOnce(new Error("Disk error"));
      else
        vi.spyOn(db.attachments, "where").mockImplementationOnce(() => {
          throw new Error("Disk error");
        });
      await expect(useStore.getState().removeExpense(original.expenseId, "g")).rejects.toThrow(
        "Disk error",
      );
      expect(await db.expenses.get(original.expenseId)).toEqual(previous);
      expect(await db.attachments.count()).toBe(3);
      expect(useStore.getState().expenses).toEqual([previous]);
      expect(await db.groups.toArray()).toEqual(groups);
      expect(useStore.getState().groups).toEqual(groups);
      await useStore.getState().removeExpense(original.expenseId, "g");
      expect(await db.expenses.count()).toBe(0);
    },
  );
  it("rejects foreign, missing, and repeated deletions", async () => {
    const original = await useStore.getState().addExpense(input());
    await expect(useStore.getState().removeExpense(original.expenseId, "other")).rejects.toThrow(
      "not found",
    );
    await expect(useStore.getState().removeExpense("missing", "g")).rejects.toThrow("not found");
    expect(await db.expenses.get(original.expenseId)).toEqual(original);
    await useStore.getState().removeExpense(original.expenseId, "g");
    await expect(useStore.getState().removeExpense(original.expenseId, "g")).rejects.toThrow(
      "not found",
    );
  });
  it("cannot resurrect an expense when update races deletion", async () => {
    const original = await useStore.getState().addExpense(input());
    await Promise.allSettled([
      useStore.getState().removeExpense(original.expenseId, "g"),
      useStore.getState().updateExpense(original.expenseId, input()),
    ]);
    expect(await db.expenses.get(original.expenseId)).toBeUndefined();
    expect(useStore.getState().expenses).toEqual([]);
  });
});
