import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/configs/db";
import { useStore } from "@/shared/configs/store";

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
  await db.members.add({ id: "a", groupId: "g", personId: "self" });
  await useStore.getState().init();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});

describe("addMember", () => {
  it.each(["group", "person"])(
    "rejects a missing persisted %s even when memory is stale",
    async (missing) => {
      if (missing === "group") await db.groups.delete("g");
      else await db.people.delete("friend");
      await expect(useStore.getState().addMember("g", "friend")).rejects.toThrow("not found");
      expect(await db.members.count()).toBe(1);
      expect(useStore.getState().members).toHaveLength(1);
    },
  );
  it("serializes concurrent additions and rejects the duplicate", async () => {
    const results = await Promise.allSettled([
      useStore.getState().addMember("g", "friend"),
      useStore.getState().addMember("g", "friend"),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    const rows = await db.members.where("personId").equals("friend").toArray();
    expect(rows).toHaveLength(1);
    expect(useStore.getState().members.filter((member) => member.personId === "friend")).toEqual(
      rows,
    );
  });
  it("does not update memory after a write failure", async () => {
    vi.spyOn(db.members, "add").mockRejectedValueOnce(new Error("Disk full"));
    await expect(useStore.getState().addMember("g", "friend")).rejects.toThrow("Disk full");
    expect(await db.members.count()).toBe(1);
    expect(useStore.getState().members).toHaveLength(1);
  });
});

describe("removePerson", () => {
  it("protects persisted self identity even when client identity and memberships are missing", async () => {
    useStore.setState({ localUser: null, members: [] });
    const before = await db.people.get("self");
    await expect(useStore.getState().removePerson("self")).rejects.toThrow(
      "cannot delete yourself",
    );
    expect(await db.people.get("self")).toEqual(before);
    expect(await db.members.get("a")).toBeDefined();
    expect((await db.groups.get("g"))?.frequentPayerIds).toEqual(["a"]);
    expect(useStore.getState().people.find((person) => person.id === "self")).toEqual(before);
  });
  it("still allows deletion of an unreferenced friend", async () => {
    await useStore.getState().addMember("g", "friend");
    await useStore.getState().removePerson("friend");
    expect(await db.people.get("friend")).toBeUndefined();
    expect(await db.members.where("personId").equals("friend").count()).toBe(0);
    expect(useStore.getState().people.some((person) => person.id === "friend")).toBe(false);
  });
});
