import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/configs/db";
import { useStore } from "@/shared/configs/store";

import type { OnboardingSettings } from "@/shared/types/domain.types";

beforeEach(async () => {
  await db.delete();
  await db.open();
  useStore.setState(useStore.getInitialState(), true);
  await db.localUser.add({ id: "self", name: "Amy", icon: "🦊" });
  await db.people.bulkAdd([
    { id: "self", name: "Amy", icon: "🦊" },
    { id: "friend", name: "Bea", icon: "🐻" },
  ]);
  await db.groups.bulkAdd([
    {
      id: "trip",
      name: "Trip",
      icon: "🏕️",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: ["a"],
    },
    {
      id: "home",
      name: "Home",
      icon: "🏡",
      currency: "INR",
      createdAt: 2,
      frequentPayerIds: ["h"],
    },
  ]);
  await db.members.bulkAdd([
    { id: "a", groupId: "trip", personId: "self" },
    { id: "b", groupId: "trip", personId: "friend" },
    { id: "h", groupId: "home", personId: "self" },
  ]);
  await db.categories.bulkAdd([
    { id: "food", groupId: "trip", name: "Food", icon: "🍽️", isActive: true },
    { id: "bills", groupId: "home", name: "Bills", icon: "💡", isActive: true },
  ]);
  await db.tags.bulkAdd([
    { id: "holiday", groupId: "trip", name: "Holiday", color: "#123456" },
    { id: "monthly", groupId: "home", name: "Monthly", color: "#654321" },
  ]);
  await db.expenses.bulkAdd([
    {
      expenseId: "lunch",
      groupId: "trip",
      expenseName: "Lunch",
      categoryId: "food",
      createdBy: "a",
      createdAt: 1,
      when: 1,
      splitType: "equal",
      splitMeta: [],
      tagIds: ["holiday"],
      attachmentIds: ["receipt"],
      transactions: {
        paid: [{ memberId: "a", amount: 100 }],
        owes: [
          { memberId: "a", amount: 50 },
          { memberId: "b", amount: 50 },
        ],
      },
    },
    {
      expenseId: "rent",
      groupId: "home",
      expenseName: "Rent",
      categoryId: "bills",
      createdBy: "h",
      createdAt: 2,
      when: 2,
      splitType: "equal",
      splitMeta: [],
      tagIds: ["monthly"],
      attachmentIds: ["home-receipt"],
      transactions: {
        paid: [{ memberId: "h", amount: 200 }],
        owes: [{ memberId: "h", amount: 200 }],
      },
    },
  ]);
  await db.settlements.add({
    id: "payment",
    groupId: "trip",
    kind: "payment",
    fromMemberId: "b",
    toMemberId: "a",
    recordedBy: "a",
    amount: 25,
    when: 3,
    createdAt: 3,
    tagIds: ["holiday"],
  });
  await db.attachments.bulkAdd([
    {
      id: "receipt",
      expenseId: "lunch",
      mimeType: "image/png",
      blob: new Blob(["lunch"]),
      createdAt: 1,
    },
    {
      id: "home-receipt",
      expenseId: "rent",
      mimeType: "image/png",
      blob: new Blob(["rent"]),
      createdAt: 2,
    },
  ]);
  const onboarding: OnboardingSettings = {
    id: "onboarding",
    complete: true,
    lastCompletedStep: "members",
    groupId: "trip",
  };
  await db.settings.put(onboarding);
  await useStore.getState().init();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});

describe("removeGroup", () => {
  it("atomically deletes only group-owned data and keeps shared people and the other group", async () => {
    await useStore.getState().removeGroup("trip");
    expect((await db.groups.toArray()).map((row) => row.id)).toEqual(["home"]);
    expect((await db.members.toArray()).map((row) => row.id)).toEqual(["h"]);
    expect((await db.categories.toArray()).map((row) => row.id)).toEqual(["bills"]);
    expect((await db.tags.toArray()).map((row) => row.id)).toEqual(["monthly"]);
    expect((await db.expenses.toArray()).map((row) => row.expenseId)).toEqual(["rent"]);
    expect(await db.settlements.count()).toBe(0);
    expect((await db.attachments.toArray()).map((row) => row.id)).toEqual(["home-receipt"]);
    expect(await db.people.count()).toBe(2);
    expect(await db.localUser.count()).toBe(1);
    expect(await db.settings.get("onboarding")).toMatchObject({ complete: true, groupId: "home" });
    expect(useStore.getState()).toMatchObject({
      onboardingGroupId: "home",
      groups: [{ id: "home" }],
      expenses: [{ expenseId: "rent" }],
    });
    await useStore.getState().init();
    expect(useStore.getState().groups).toHaveLength(1);
  });

  it("allows deleting the final group without restarting onboarding or deleting identity", async () => {
    await useStore.getState().removeGroup("trip");
    await useStore.getState().removeGroup("home");
    expect(await db.groups.count()).toBe(0);
    expect(await db.members.count()).toBe(0);
    expect(await db.expenses.count()).toBe(0);
    expect(await db.settlements.count()).toBe(0);
    expect(await db.attachments.count()).toBe(0);
    expect(await db.settings.get("onboarding")).toMatchObject({ complete: true, groupId: null });
    expect(useStore.getState()).toMatchObject({
      onboardingComplete: true,
      onboardingGroupId: null,
      groups: [],
    });
    expect(await db.people.count()).toBe(2);
    await useStore.getState().init();
    expect(useStore.getState().onboardingComplete).toBe(true);
  });

  it("rejects missing persisted groups without changing memory", async () => {
    await expect(useStore.getState().removeGroup("missing")).rejects.toThrow("Group not found");
    expect(await db.groups.count()).toBe(2);
    expect(useStore.getState().groups).toHaveLength(2);
  });

  it("rolls back every deleted row and leaves memory untouched if a write fails", async () => {
    vi.spyOn(db.groups, "delete").mockRejectedValueOnce(new Error("Disk full"));
    await expect(useStore.getState().removeGroup("trip")).rejects.toThrow("Disk full");
    expect(await db.groups.count()).toBe(2);
    expect(await db.members.count()).toBe(3);
    expect(await db.expenses.count()).toBe(2);
    expect(await db.settlements.count()).toBe(1);
    expect(await db.attachments.count()).toBe(2);
    expect(await db.tags.count()).toBe(2);
    expect(await db.categories.count()).toBe(2);
    expect(await db.settings.get("onboarding")).toMatchObject({ groupId: "trip" });
    expect(useStore.getState()).toMatchObject({ onboardingGroupId: "trip" });
    expect(useStore.getState().groups).toHaveLength(2);
  });
});
