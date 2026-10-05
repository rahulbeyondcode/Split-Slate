import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/configs/db";
import { useStore } from "@/shared/configs/store";
import { calculateBalances } from "@/shared/utils/balances";

const input = (amount = 4_000) => ({
  groupId: "trip",
  fromMemberId: "friend-member",
  toMemberId: "self-member",
  amount,
  when: 1_700_000_000_000,
  tagIds: ["tag"],
});

beforeEach(async () => {
  await db.delete();
  await db.open();
  useStore.setState(useStore.getInitialState(), true);
  await db.localUser.add({ id: "self", name: "Rahul", icon: "🦊" });
  await db.people.bulkAdd([
    { id: "self", name: "Rahul", icon: "🦊" },
    { id: "friend", name: "Rohan", icon: "🐻" },
  ]);
  await db.groups.add({
    id: "trip",
    name: "Trip",
    icon: "🏖️",
    currency: "INR",
    createdAt: 1,
    frequentPayerIds: ["self-member"],
  });
  await db.members.bulkAdd([
    { id: "self-member", groupId: "trip", personId: "self" },
    { id: "friend-member", groupId: "trip", personId: "friend" },
  ]);
  await db.tags.add({ id: "tag", groupId: "trip", name: "Cash", color: "#218f68" });
  await db.categories.add({
    id: "food",
    groupId: "trip",
    name: "Food",
    icon: "🍲",
    isActive: true,
  });
  await db.expenses.add({
    expenseId: "dinner",
    groupId: "trip",
    expenseName: "Dinner",
    createdBy: "self-member",
    categoryId: "food",
    createdAt: 1,
    when: 1,
    splitType: "equal",
    splitMeta: [],
    tagIds: [],
    attachmentIds: [],
    transactions: {
      paid: [{ memberId: "self-member", amount: 10_000 }],
      owes: [
        { memberId: "self-member", amount: 5_000 },
        { memberId: "friend-member", amount: 5_000 },
      ],
    },
  });
  await useStore.getState().init();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});

describe("group payment records", () => {
  it("persists a partial payment, reloads it, and adjusts only balances", async () => {
    const saved = await useStore.getState().addSettlement(input());
    expect(saved).toMatchObject({ kind: "payment", tagIds: ["tag"], amount: 4_000 });
    expect(
      calculateBalances(
        useStore.getState().expenses,
        ["self-member", "friend-member"],
        useStore.getState().settlements,
      ).get("friend-member"),
    ).toBe(-1_000);
    expect(useStore.getState().expenses[0].transactions.paid[0].amount).toBe(10_000);
    expect(useStore.getState().activityEvents.at(-1)?.kind).toBe("settlement");
    useStore.setState({ settlements: [] });
    await useStore.getState().init();
    expect(useStore.getState().settlements).toEqual([saved]);
  });
  it("allows overpayment, editing, and confirmed-action deletion without touching expenses", async () => {
    const first = await useStore.getState().addSettlement(input(6_000));
    expect(
      calculateBalances(
        useStore.getState().expenses,
        ["self-member", "friend-member"],
        useStore.getState().settlements,
      ).get("friend-member"),
    ).toBe(1_000);
    const edited = await useStore.getState().updateSettlement(first.id, input(2_000));
    expect(edited.id).toBe(first.id);
    expect(edited.createdAt).toBe(first.createdAt);
    expect((await db.settlements.get(first.id))?.amount).toBe(2_000);
    await useStore.getState().removeSettlement(first.id, "trip");
    expect(await db.settlements.count()).toBe(0);
    expect(await db.expenses.count()).toBe(1);
  });
  it("rejects invalid and cross-group references without partial writes", async () => {
    await expect(useStore.getState().addSettlement({ ...input(), amount: 0 })).rejects.toThrow(
      "positive",
    );
    await expect(
      useStore.getState().addSettlement({ ...input(), toMemberId: "friend-member" }),
    ).rejects.toThrow("different");
    await expect(
      useStore.getState().addSettlement({ ...input(), tagIds: ["missing"] }),
    ).rejects.toThrow("tags");
    await expect(
      useStore.getState().addSettlement({ ...input(), fromMemberId: "missing" }),
    ).rejects.toThrow("members");
    expect(await db.settlements.count()).toBe(0);
  });
  it("rolls back both payment and activity if the activity write fails", async () => {
    vi.spyOn(db.activityEvents, "add").mockRejectedValueOnce(new Error("Disk full"));
    await expect(useStore.getState().addSettlement(input())).rejects.toThrow("Disk full");
    expect(await db.settlements.count()).toBe(0);
    expect(useStore.getState().settlements).toEqual([]);
  });
  it("rejects deleting an offsetting payment if remaining balances would overflow", async () => {
    const maximum = Number.MAX_SAFE_INTEGER;
    const offset = await useStore.getState().addSettlement(input(maximum));
    await useStore.getState().addSettlement({
      ...input(maximum),
      fromMemberId: "self-member",
      toMemberId: "friend-member",
    });
    await useStore.getState().addSettlement({
      ...input(maximum - 5_000),
      fromMemberId: "self-member",
      toMemberId: "friend-member",
    });
    await expect(useStore.getState().removeSettlement(offset.id, "trip")).rejects.toThrow(
      "supported range",
    );
    expect(await db.settlements.count()).toBe(3);
  });
  it("guards deletion of referenced members and people", async () => {
    await useStore.getState().addSettlement(input());
    await expect(useStore.getState().removeMember("friend-member")).rejects.toThrow("payments");
    await expect(useStore.getState().removePerson("friend")).rejects.toThrow("payments");
  });
});
