import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/configs/db";
import { useStore } from "@/shared/configs/store";

import type { CreateExpenseInput } from "@/features/expenses/types/expenses.types";
import type { Expense } from "@/shared/types/domain.types";

const expense = (expenseId = "lunch", tagIds = ["trip", "keep"]): Expense => ({
  expenseId,
  groupId: "g",
  expenseName: "Lunch",
  createdBy: "a",
  createdAt: 1,
  when: new Date("2026-09-20T12:00").getTime(),
  categoryId: "food",
  tagIds,
  attachmentIds: [],
  splitType: "equal",
  splitMeta: [],
  transactions: {
    paid: [{ memberId: "a", amount: 10000 }],
    owes: [{ memberId: "a", amount: 10000 }],
  },
});

const input = (tagIds = ["keep"]): CreateExpenseInput => ({
  groupId: "g",
  currency: "INR",
  values: {
    expenseName: "Updated lunch",
    amount: "125",
    when: "2026-09-21T13:00",
    categoryId: "food",
    tagIds,
    payerMode: "single",
    payerId: "a",
    payers: [],
    splitType: "equal",
    participants: [{ memberId: "a", selected: true, value: "" }],
  },
});

beforeEach(async () => {
  await db.delete();
  await db.open();
  useStore.setState(useStore.getInitialState(), true);
  await db.localUser.add({ id: "self", name: "Amy", icon: "🦊" });
  await db.people.add({ id: "self", name: "Amy", icon: "🦊" });
  await db.groups.add({
    id: "g",
    name: "Trip",
    icon: "🏕️",
    currency: "INR",
    createdAt: 1,
    frequentPayerIds: ["a"],
  });
  await db.members.add({ id: "a", groupId: "g", personId: "self" });
  await db.categories.add({ id: "food", groupId: "g", name: "Food", icon: "🍽️", isActive: true });
  await db.tags.bulkAdd([
    { id: "trip", groupId: "g", name: "Trip", color: "#123456" },
    { id: "keep", groupId: "g", name: "Keep", color: "#654321" },
  ]);
  await db.expenses.add(expense());
  await useStore.getState().init();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});

describe("removeTag", () => {
  it("removes only the tag and its group references, preserving allocations, receipts, and rankings", async () => {
    const original = { ...expense(), attachmentIds: ["receipt"] };
    const other = { ...expense("other", ["foreign"]), groupId: "elsewhere" };
    const untagged = expense("untagged", []);
    await db.expenses.bulkPut([original, other, untagged]);
    await db.tags.add({ id: "foreign", groupId: "elsewhere", name: "Trip", color: "#123456" });
    await db.attachments.add({
      id: "receipt",
      expenseId: "lunch",
      blob: new Blob(["receipt"]),
      mimeType: "image/png",
      createdAt: 1,
    });
    await useStore.getState().init();
    const groups = await db.groups.toArray();
    const receipts = await db.attachments.toArray();

    await useStore.getState().removeTag("trip");

    expect(await db.tags.get("trip")).toBeUndefined();
    expect((await db.tags.toArray()).map((tag) => tag.id)).toEqual(["foreign", "keep"]);
    expect(await db.expenses.get("lunch")).toEqual({ ...original, tagIds: ["keep"] });
    expect(await db.expenses.get("other")).toEqual(other);
    expect(await db.expenses.get("untagged")).toEqual(untagged);
    expect(await db.attachments.toArray()).toEqual(receipts);
    expect(await db.groups.toArray()).toEqual(groups);
    expect(useStore.getState().expenses).toEqual(
      expect.arrayContaining(await db.expenses.toArray()),
    );
    expect(useStore.getState().expenses).toHaveLength(3);
    expect(useStore.getState().tags).toEqual(await db.tags.toArray());
    expect(useStore.getState().groups).toEqual(groups);
  });

  it("does not resurrect a deleted expense retained in stale memory", async () => {
    await db.attachments.add({
      id: "receipt",
      expenseId: "lunch",
      blob: new Blob(["receipt"]),
      mimeType: "image/png",
      createdAt: 1,
    });
    const staleExpenses = useStore.getState().expenses;
    await useStore.getState().removeExpense("lunch", "g");
    useStore.setState({ expenses: staleExpenses });

    await useStore.getState().removeTag("trip");

    expect(await db.expenses.count()).toBe(0);
    expect(await db.attachments.count()).toBe(0);
    expect(useStore.getState().expenses).toEqual([]);
    await useStore.getState().init();
    expect(useStore.getState().expenses).toEqual([]);
  });

  it("preserves newer expense fields and refreshes the stale group snapshot", async () => {
    const staleExpenses = useStore.getState().expenses;
    const updated = await useStore.getState().updateExpense("lunch", input(["trip", "keep"]));
    useStore.setState({ expenses: staleExpenses });

    await useStore.getState().removeTag("trip");

    const expected = { ...updated, tagIds: ["keep"] };
    expect(await db.expenses.get("lunch")).toEqual(expected);
    expect(useStore.getState().expenses).toEqual([expected]);
  });

  it("cleans references on persisted expenses absent from memory", async () => {
    await db.expenses.add(expense("new"));
    await useStore.getState().removeTag("trip");
    expect((await db.expenses.toArray()).map((row) => row.tagIds)).toEqual([["keep"], ["keep"]]);
    expect(useStore.getState().expenses).toEqual(await db.expenses.toArray());
  });

  it("uses the persisted tag even when the cached tag is absent or has another group", async () => {
    useStore.setState({ tags: [{ id: "trip", groupId: "wrong", name: "Trip", color: "#123456" }] });
    await useStore.getState().removeTag("trip");
    expect((await db.expenses.get("lunch"))?.tagIds).toEqual(["keep"]);
    await useStore.getState().removeTag("keep");
    expect((await db.expenses.get("lunch"))?.tagIds).toEqual([]);
    expect(useStore.getState().expenses[0].tagIds).toEqual([]);
  });

  it("rejects a missing persisted tag without changing expenses or memory", async () => {
    await db.tags.delete("trip");
    const before = useStore.getState();
    await expect(useStore.getState().removeTag("trip")).rejects.toThrow("Tag not found");
    expect(await db.expenses.get("lunch")).toEqual(expense());
    expect(useStore.getState()).toBe(before);
  });

  it("removes an unused tag and rejects repeated removal", async () => {
    await db.expenses.clear();
    useStore.setState({ expenses: [] });
    await useStore.getState().removeTag("trip");
    await expect(useStore.getState().removeTag("trip")).rejects.toThrow("Tag not found");
    expect(await db.expenses.count()).toBe(0);
    expect(useStore.getState().tags.map((tag) => tag.id)).toEqual(["keep"]);
  });

  it("does not restore another tag during concurrent tag removals", async () => {
    await Promise.all([
      useStore.getState().removeTag("trip"),
      useStore.getState().removeTag("keep"),
    ]);
    expect(await db.tags.count()).toBe(0);
    expect((await db.expenses.get("lunch"))?.tagIds).toEqual([]);
    expect(useStore.getState().expenses).toEqual(await db.expenses.toArray());
    expect(useStore.getState().tags).toEqual([]);
  });

  it.each(["expense-first", "tag-first"])(
    "keeps an expense deleted when removals overlap (%s)",
    async (order) => {
      const removeExpense = () => useStore.getState().removeExpense("lunch", "g");
      const removeTag = () => useStore.getState().removeTag("trip");
      const operations =
        order === "expense-first" ? [removeExpense, removeTag] : [removeTag, removeExpense];
      await Promise.all(operations.map((operation) => operation()));
      expect(await db.expenses.count()).toBe(0);
      expect(useStore.getState().expenses).toEqual([]);
      expect(await db.tags.get("trip")).toBeUndefined();
    },
  );

  it.each(["expense-first", "tag-first"])(
    "preserves an overlapping expense edit (%s)",
    async (order) => {
      const updateExpense = () => useStore.getState().updateExpense("lunch", input());
      const removeTag = () => useStore.getState().removeTag("trip");
      const operations =
        order === "expense-first" ? [updateExpense, removeTag] : [removeTag, updateExpense];
      await Promise.all(operations.map((operation) => operation()));
      expect(await db.expenses.get("lunch")).toMatchObject({
        expenseName: "Updated lunch",
        tagIds: ["keep"],
        transactions: { paid: [{ memberId: "a", amount: 12500 }] },
      });
      expect(useStore.getState().expenses).toEqual(await db.expenses.toArray());
    },
  );

  it.each(["expense-first", "tag-first"])(
    "cannot leave a deleted tag on a concurrent new expense (%s)",
    async (order) => {
      const addExpense = () => useStore.getState().addExpense(input(["trip"]));
      const removeTag = () => useStore.getState().removeTag("trip");
      const operations =
        order === "expense-first" ? [addExpense, removeTag] : [removeTag, addExpense];
      const results = await Promise.allSettled(operations.map((operation) => operation()));
      expect(results.map((result) => result.status)).toEqual(
        order === "expense-first" ? ["fulfilled", "fulfilled"] : ["fulfilled", "rejected"],
      );
      expect((await db.expenses.toArray()).every((row) => !row.tagIds.includes("trip"))).toBe(true);
      expect(useStore.getState().expenses).toEqual(
        expect.arrayContaining(await db.expenses.toArray()),
      );
      expect(useStore.getState().expenses).toHaveLength(await db.expenses.count());
    },
  );

  it.each(["tag", "second-expense"])(
    "rolls back the entire cleanup and preserves memory if the %s write fails",
    async (failure) => {
      await db.expenses.add(expense("second"));
      await useStore.getState().init();
      const before = useStore.getState();
      const tags = await db.tags.toArray();
      const expenses = await db.expenses.toArray();
      if (failure === "tag") {
        vi.spyOn(db.tags, "delete").mockRejectedValueOnce(new Error("Disk full"));
      } else {
        const update = db.expenses.update.bind(db.expenses);
        vi.spyOn(db.expenses, "update")
          .mockImplementationOnce((key, changes) => update(key, changes))
          .mockRejectedValueOnce(new Error("Disk full"));
      }

      await expect(useStore.getState().removeTag("trip")).rejects.toThrow("Disk full");
      expect(await db.tags.toArray()).toEqual(tags);
      expect(await db.expenses.toArray()).toEqual(expenses);
      expect(useStore.getState()).toBe(before);
      vi.restoreAllMocks();
      await useStore.getState().removeTag("trip");
      expect((await db.expenses.toArray()).map((row) => row.tagIds)).toEqual([["keep"], ["keep"]]);
      expect(useStore.getState().expenses).toEqual(await db.expenses.toArray());
    },
  );
});
