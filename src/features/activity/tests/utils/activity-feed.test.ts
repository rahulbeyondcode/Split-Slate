import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { activityFeed } from "@/features/activity/utils/activity-feed";
import { db } from "@/shared/configs/db";
import { useStore } from "@/shared/configs/store";

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
    frequentPayerIds: [],
  });
  await db.members.add({ id: "m", groupId: "g", personId: "self" });
  await db.categories.add({ id: "food", groupId: "g", name: "Food", icon: "🍽️", isActive: true });
  await db.expenses.add({
    expenseId: "older",
    groupId: "g",
    expenseName: "Old lunch",
    createdBy: "m",
    categoryId: "food",
    createdAt: 10,
    when: 999,
    splitType: "equal",
    splitMeta: [],
    tagIds: [],
    attachmentIds: [],
    transactions: {
      paid: [{ memberId: "m", amount: 1200 }],
      owes: [{ memberId: "m", amount: 1200 }],
    },
  });
  await useStore.getState().init();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});

describe("activity history", () => {
  it("shows legacy expenses and persistent category and tag deletion snapshots in recording order", async () => {
    const category = await useStore.getState().addCategory("g", "Taxi", "🚕");
    await useStore.getState().removeCategory(category.id);
    const tag = await useStore.getState().addTag("g", "Holiday", "#112233");
    await useStore.getState().removeTag(tag.id);
    expect(activityFeed(useStore.getState(), "g").map((item) => item.action)).toContain("deleted");
    const saved = await db.activityEvents.toArray();
    expect(saved).toHaveLength(4);
    await useStore.getState().init();
    const events = activityFeed(useStore.getState(), "g");
    expect(events.map((item) => item.label)).toEqual(
      expect.arrayContaining(["You paid Old lunch", "Taxi", "Holiday"]),
    );
    expect(events.filter((item) => item.action === "deleted").map((item) => item.label)).toEqual(
      expect.arrayContaining(["Taxi", "Holiday"]),
    );
    expect(events.map((item) => item.createdAt)).toEqual(
      events.map((item) => item.createdAt).sort((a, b) => b - a),
    );
    expect(activityFeed(useStore.getState(), "other")).toEqual([]);
  });

  it("keeps an expense deletion even after the row has been removed", async () => {
    await useStore.getState().removeExpense("older", "g");
    expect(await db.expenses.count()).toBe(0);
    await useStore.getState().init();
    const events = activityFeed(useStore.getState());
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: "expense",
      action: "deleted",
      label: "Old lunch",
      amount: 1200,
    });
  });

  it("rolls back an entity write if its activity event cannot be recorded", async () => {
    vi.spyOn(db.activityEvents, "add").mockRejectedValueOnce(new Error("History unavailable"));
    await expect(useStore.getState().addTag("g", "Blocked", "#112233")).rejects.toThrow(
      "History unavailable",
    );
    expect(await db.tags.count()).toBe(0);
    expect(useStore.getState().tags).toEqual([]);
  });

  it("removes a deleted group's history except creation and deletion, preserving global contacts", async () => {
    const person = await useStore.getState().addPerson("Bea", "🐻");
    const member = await useStore.getState().addMember("g", person.id);
    await useStore.getState().removeMember(member.id);
    await useStore.getState().removePerson(person.id);
    const tag = await useStore.getState().addTag("g", "Holiday", "#123456");
    await useStore.getState().removeTag(tag.id);
    const category = await useStore.getState().addCategory("g", "Taxi", "🚕");
    await useStore.getState().removeCategory(category.id);
    await useStore.getState().removeExpense("older", "g");
    await useStore.getState().updateGroup("g", { name: "Renamed trip" });
    const other = await useStore.getState().createGroup("Other", "✦", "INR");
    await useStore.getState().removeGroup("g");
    await useStore.getState().init();

    const events = activityFeed(useStore.getState());
    expect(activityFeed(useStore.getState(), "g").map((item) => [item.kind, item.action])).toEqual([
      ["group", "deleted"],
      ["group", "created"],
    ]);
    expect(events.find((item) => item.groupId === "g" && item.action === "created")).toMatchObject({
      groupName: "Renamed trip",
      label: "Renamed trip",
      createdAt: 1,
    });
    expect(events.filter((item) => item.kind === "person")).toHaveLength(2);
    expect(events.some((item) => item.groupId === other.group.id)).toBe(true);
    expect(await db.activityEvents.where("groupId").equals("g").count()).toBe(2);
  });

  it("preserves the original group creation record instead of adding a duplicate", async () => {
    const group = await useStore.getState().createGroup("Another", "✦", "INR");
    const created = useStore
      .getState()
      .activityEvents.find((item) => item.groupId === group.group.id);
    await useStore.getState().addCategory(group.group.id, "Food", "🍽️");
    await useStore.getState().removeGroup(group.group.id);
    const events = activityFeed(useStore.getState(), group.group.id);
    expect(events.map((item) => item.action)).toEqual(["deleted", "created"]);
    expect(events[1].id).toBe(created?.id);
  });

  it("treats an older imported-group entry as creation and ignores stale hydrated events", async () => {
    const imported = {
      id: "imported",
      groupId: "g",
      groupName: "Trip",
      subjectId: "g",
      kind: "group" as const,
      action: "imported" as const,
      label: "Trip",
      icon: "🏕️",
      amount: null,
      currency: "INR",
      createdAt: 20,
    };
    await db.activityEvents.add(imported);
    await db.activityEvents.add({
      ...imported,
      id: "tag",
      kind: "tag",
      action: "deleted",
      label: "Old tag",
    });
    useStore.setState((state) => ({
      activityEvents: [...state.activityEvents, { ...imported, id: "stale", action: "updated" }],
    }));
    await useStore.getState().removeGroup("g");

    const persisted = await db.activityEvents.where("groupId").equals("g").toArray();
    expect(persisted).toHaveLength(2);
    expect(persisted.find((event) => event.id === "imported")?.action).toBe("created");
    expect(activityFeed(useStore.getState(), "g").map((item) => item.id)).toEqual([
      expect.any(String),
      "imported",
    ]);
    expect(useStore.getState().activityEvents.some((item) => item.id === "stale")).toBe(false);
  });

  it("rolls back group deletion if activity cleanup fails", async () => {
    await useStore.getState().addTag("g", "Holiday", "#123456");
    vi.spyOn(db.activityEvents, "bulkDelete").mockRejectedValueOnce(new Error("Cleanup failed"));
    await expect(useStore.getState().removeGroup("g")).rejects.toThrow("Cleanup failed");
    expect(await db.groups.get("g")).toBeTruthy();
    expect(await db.tags.count()).toBe(1);
    expect(await db.expenses.count()).toBe(1);
    expect(useStore.getState().groups.some((item) => item.id === "g")).toBe(true);
  });

  it("upgrades an existing version 1 database without clearing saved entities", async () => {
    await db.delete();
    const legacy = new Dexie("split-slate");
    legacy.version(1).stores({
      localUser: "id",
      groups: "id",
      people: "id",
      members: "id, groupId, personId",
      categories: "id, groupId",
      tags: "id, groupId",
      expenses: "expenseId, groupId",
      attachments: "id, expenseId",
      settings: "id",
    });
    await legacy.open();
    await legacy.table("groups").add({
      id: "saved",
      name: "Saved trip",
      icon: "🏕️",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: [],
    });
    legacy.close();

    await db.open();
    expect((await db.groups.get("saved"))?.name).toBe("Saved trip");
    expect(await db.activityEvents.count()).toBe(0);
  });
});
