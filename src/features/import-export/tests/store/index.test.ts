import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { importGroupTransfer, readGroupExportSource } from "@/features/import-export/store";
import { buildGroupTransfer } from "@/features/import-export/utils/build-transfer";
import {
  decodeTransferPayload,
  encodeTransferPayload,
} from "@/features/import-export/utils/export-link";
import { PersonConflictsError } from "@/features/import-export/utils/person-conflicts";
import { db } from "@/shared/configs/db";

import {
  SEED_DEFAULT_GROUP_CATEGORIES,
  SEED_MASTER_CATEGORIES,
} from "@/shared/constants/categories";
import type { GroupExportSource } from "@/features/import-export/types/import-export.types";
import type { OnboardingSettings, SettingsRecord } from "@/shared/types/domain.types";

import {
  createExportSource,
  GROUP_ONLY_SELECTION,
} from "@/features/import-export/tests/fixtures/transfer-fixture";

const seedSource = async (source: GroupExportSource) => {
  await db.groups.add(source.group);
  await db.people.bulkAdd(source.people);
  await db.members.bulkAdd(source.members);
  await db.categories.bulkAdd(source.categories);
  if (source.tags.length) await db.tags.bulkAdd(source.tags);
  if (source.expenses.length) await db.expenses.bulkAdd(source.expenses);
  if (source.settlements.length) await db.settlements.bulkAdd(source.settlements);
  if (source.attachmentFiles.length) await db.attachments.bulkAdd(source.attachmentFiles);
};

beforeEach(async () => {
  await db.delete();
  await db.open();
  const settings: SettingsRecord[] = [
    {
      id: "categories",
      master: SEED_MASTER_CATEGORIES,
      default: SEED_DEFAULT_GROUP_CATEGORIES,
    },
    { id: "onboarding", complete: false, lastCompletedStep: null, groupId: null },
  ];
  await db.settings.bulkAdd(settings);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});

describe("readGroupExportSource", () => {
  it("reads one consistent persisted source with blobs outside portable data", async () => {
    const fixture = createExportSource({ withAttachments: true });
    await seedSource(fixture);
    const source = await readGroupExportSource(fixture.group.id);
    expect(source.group).toEqual(fixture.group);
    expect(source.people).toEqual(fixture.people);
    expect(source.attachmentFiles[0].blob).toBeInstanceOf(Blob);
  });

  it("rejects missing groups and inconsistent persisted references", async () => {
    await expect(readGroupExportSource("missing")).rejects.toThrow("Group not found");
    const fixture = createExportSource();
    await seedSource(fixture);
    await db.people.delete(fixture.people[0].id);
    await expect(readGroupExportSource(fixture.group.id)).rejects.toThrow("referenced person");

    await db.people.put(fixture.people[0]);
    await db.expenses.update(fixture.expenses[0].expenseId, { attachmentIds: ["missing-receipt"] });
    await expect(readGroupExportSource(fixture.group.id)).rejects.toThrow("receipt references");

    await db.expenses.update(fixture.expenses[0].expenseId, { attachmentIds: [] });
    await db.attachments.put({
      id: "surplus-receipt",
      expenseId: fixture.expenses[0].expenseId,
      blob: new Blob(["surplus"], { type: "image/jpeg" }),
      mimeType: "image/jpeg",
      createdAt: 1,
    });
    await expect(readGroupExportSource(fixture.group.id)).rejects.toThrow("receipt references");
  });
});

describe("importGroupTransfer", () => {
  it("imports payments with fresh IDs, remapped members, and optional tags", async () => {
    const source = createExportSource({ withSettlements: true });
    const bundle = (
      await buildGroupTransfer(source, {
        categories: true,
        tags: true,
        members: true,
        expenses: true,
        attachments: false,
      })
    ).bundle;
    const result = await importGroupTransfer({
      source: { bundle, attachmentFiles: [] },
      identity: { type: "member", memberId: bundle.members[0].id },
    });
    const [payment] = await db.settlements.where("groupId").equals(result.group.id).toArray();
    expect(payment.id).not.toBe(source.settlements[0].id);
    expect(payment.amount).toBe(source.settlements[0].amount);
    expect(payment.fromMemberId).not.toBe(source.settlements[0].fromMemberId);
    expect(payment.tagIds).toHaveLength(1);
    expect((await db.tags.get(payment.tagIds[0]))?.groupId).toBe(result.group.id);
  });
  it("imports a compact link with original Person IDs and fresh group-owned IDs", async () => {
    const { bundle } = await buildGroupTransfer(createExportSource(), {
      categories: true,
      tags: true,
      members: true,
      expenses: true,
      attachments: false,
    });
    const compact = await decodeTransferPayload(`#${await encodeTransferPayload(bundle)}`);
    const result = await importGroupTransfer({
      source: { bundle: compact, attachmentFiles: [] },
      identity: { type: "member", memberId: compact.members[0].id },
    });
    const imported = await db.members.where("groupId").equals(result.group.id).toArray();
    expect(result.group.id).not.toBe(compact.group.id);
    expect(imported.map((member) => member.id)).not.toContain(compact.members[0].id);
    expect((await db.people.toArray()).some((person) => person.id === compact.people[1].id)).toBe(
      true,
    );
    expect(await db.expenses.where("groupId").equals(result.group.id).count()).toBe(1);
  });

  it("claims two unrelated source Abhi members as one local person without merging memberships", async () => {
    const firstSource = createExportSource({ expenseCount: 0 });
    firstSource.people[0].name = "Abhi";
    firstSource.people[1].name = "Meenu";
    const selection = { ...GROUP_ONLY_SELECTION, members: true };
    const first = await buildGroupTransfer(firstSource, selection);
    const firstResult = await importGroupTransfer({
      source: first,
      identity: { type: "member", memberId: first.bundle.members[0].id },
    });
    const self = await db.localUser.toCollection().first();
    expect(self?.name).toBe("Abhi");

    const secondSource = createExportSource({ expenseCount: 0 });
    secondSource.group.name = "Another Trip";
    secondSource.people[0] = { id: "different-abhi-id", name: "Abhi", icon: "🦊" };
    secondSource.people[1] = { id: "different-meenu-id", name: "Meenu", icon: "🐻" };
    secondSource.members = secondSource.members.map((member, index) => ({
      ...member,
      id: `second-member-${index}`,
      personId: secondSource.people[index].id,
    }));
    secondSource.group.frequentPayerIds = secondSource.members.map((member) => member.id);
    const second = await buildGroupTransfer(secondSource, selection);
    const identity = { type: "member" as const, memberId: second.bundle.members[0].id };
    await expect(importGroupTransfer({ source: second, identity })).rejects.toThrow(
      PersonConflictsError,
    );
    expect(await db.groups.count()).toBe(1);
    const secondResult = await importGroupTransfer({
      source: second,
      identity,
      personResolutions: [
        {
          sourcePersonId: second.bundle.people[1].id,
          type: "separate",
          name: "Meenu (second trip)",
        },
      ],
    });
    const firstMembers = await db.members.where("groupId").equals(firstResult.group.id).toArray();
    const secondMembers = await db.members.where("groupId").equals(secondResult.group.id).toArray();
    expect(firstMembers[0].id).not.toBe(secondMembers[0].id);
    expect(firstMembers.some((member) => member.personId === self?.id)).toBe(true);
    expect(secondMembers.some((member) => member.personId === self?.id)).toBe(true);
    expect((await db.people.toArray()).map((person) => person.name).sort()).toEqual([
      "Abhi",
      "Meenu",
      "Meenu (second trip)",
    ]);
  });

  it("reuses a chosen existing Abhi contact but keeps a different Meenu separate", async () => {
    await db.localUser.add({ id: "self", name: "Amy", icon: "🐱" });
    await db.people.add({ id: "self", name: "Amy", icon: "🐱" });
    const firstSource = createExportSource({ expenseCount: 0 });
    firstSource.people[0].name = "Abhi";
    firstSource.people[1].name = "Meenu";
    const selection = { ...GROUP_ONLY_SELECTION, members: true };
    const first = await buildGroupTransfer(firstSource, selection);
    const firstResult = await importGroupTransfer({ source: first, identity: { type: "new" } });
    const secondSource = createExportSource({ expenseCount: 0 });
    secondSource.group.name = "Second Trip";
    secondSource.people[0] = { id: "other-abhi", name: "Abhi", icon: "🦊" };
    secondSource.people[1] = { id: "other-meenu", name: "Meenu", icon: "🐼" };
    secondSource.members = secondSource.members.map((member, index) => ({
      ...member,
      id: `second-${index}`,
      personId: secondSource.people[index].id,
    }));
    secondSource.group.frequentPayerIds = secondSource.members.map((member) => member.id);
    const second = await buildGroupTransfer(secondSource, selection);
    const secondResult = await importGroupTransfer({
      source: second,
      identity: { type: "new" },
      personResolutions: [
        {
          sourcePersonId: "other-abhi",
          type: "reuse",
          destinationPersonId: firstSource.people[0].id,
        },
        { sourcePersonId: "other-meenu", type: "separate", name: "Meenu from second trip" },
      ],
    });
    const firstMembers = await db.members.where("groupId").equals(firstResult.group.id).toArray();
    const secondMembers = await db.members.where("groupId").equals(secondResult.group.id).toArray();
    const firstAbhi = firstMembers.find((member) => member.personId === firstSource.people[0].id);
    const secondAbhi = secondMembers.find((member) => member.personId === firstSource.people[0].id);
    expect(firstAbhi?.id).toBeDefined();
    expect(secondAbhi?.id).toBeDefined();
    expect(firstAbhi?.id).not.toBe(secondAbhi?.id);
    expect(await db.people.count()).toBe(4);
  });

  it("rolls back an existing-contact rename if importing later fails", async () => {
    await db.people.add({ id: "meenu", name: "Meenu", icon: "🐻" });
    const fixture = createExportSource();
    fixture.people[1].name = "Meenu";
    const source = await buildGroupTransfer(fixture, {
      categories: true,
      tags: true,
      members: true,
      expenses: true,
      attachments: false,
    });
    vi.spyOn(db.expenses, "bulkAdd").mockRejectedValueOnce(new Error("forced failure"));
    await expect(
      importGroupTransfer({
        source,
        identity: { type: "member", memberId: source.bundle.members[0].id },
        personResolutions: [
          { sourcePersonId: fixture.people[1].id, type: "separate", name: "Meenu" },
        ],
        existingPersonRenames: [{ personId: "meenu", name: "Meenu from first trip" }],
      }),
    ).rejects.toThrow("forced failure");
    expect(await db.people.get("meenu")).toMatchObject({ name: "Meenu" });
    expect(await db.groups.count()).toBe(0);
    expect(await db.localUser.count()).toBe(0);
  });

  it("renames an existing contact for all its groups when separately importing a namesake", async () => {
    await db.people.add({ id: "meenu", name: "Meenu", icon: "🐻" });
    await db.groups.add({
      id: "old-trip",
      name: "Old Trip",
      icon: "🏕️",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: [],
    });
    await db.members.add({ id: "old-meenu", groupId: "old-trip", personId: "meenu" });
    const fixture = createExportSource({ expenseCount: 0 });
    fixture.people[1].name = "Meenu";
    const source = await buildGroupTransfer(fixture, { ...GROUP_ONLY_SELECTION, members: true });
    const result = await importGroupTransfer({
      source,
      identity: { type: "member", memberId: source.bundle.members[0].id },
      personResolutions: [
        { sourcePersonId: fixture.people[1].id, type: "separate", name: "Meenu" },
      ],
      existingPersonRenames: [{ personId: "meenu", name: "Meenu from Old Trip" }],
    });
    expect(await db.people.get("meenu")).toMatchObject({ name: "Meenu from Old Trip" });
    expect(await db.members.get("old-meenu")).toMatchObject({ personId: "meenu" });
    const imported = await db.members.where("groupId").equals(result.group.id).toArray();
    const importedPeople = await db.people.bulkGet(imported.map((member) => member.personId));
    expect(importedPeople.map((person) => person?.name)).toContain("Meenu");
  });

  it("imports a group-only package with a new identity and default categories", async () => {
    const source = await buildGroupTransfer(createExportSource(), GROUP_ONLY_SELECTION);
    const result = await importGroupTransfer({
      source,
      identity: { type: "new", name: "Recipient", icon: "🐯" },
    });

    expect(result.group.id).not.toBe(source.bundle.group.id);
    expect(await db.localUser.toCollection().first()).toMatchObject({
      name: "Recipient",
      icon: "🐯",
    });
    expect(await db.members.where("groupId").equals(result.group.id).count()).toBe(1);
    expect(await db.categories.where("groupId").equals(result.group.id).count()).toBe(
      SEED_DEFAULT_GROUP_CATEGORIES.length,
    );
    expect(await db.settings.get("onboarding")).toMatchObject({
      complete: true,
      groupId: result.group.id,
    });
  });

  it("remaps every group-owned ID, maps the chosen member to self, and persists receipts", async () => {
    const source = await buildGroupTransfer(createExportSource({ withAttachments: true }), {
      categories: true,
      tags: true,
      members: true,
      expenses: true,
      attachments: true,
    });
    const selected = source.bundle.members[0];
    const result = await importGroupTransfer({
      source,
      identity: { type: "member", memberId: selected.id },
    });
    const [localUser, members, categories, tags, expenses, attachments] = await Promise.all([
      db.localUser.toCollection().first(),
      db.members.where("groupId").equals(result.group.id).toArray(),
      db.categories.where("groupId").equals(result.group.id).toArray(),
      db.tags.where("groupId").equals(result.group.id).toArray(),
      db.expenses.where("groupId").equals(result.group.id).toArray(),
      db.attachments.toArray(),
    ]);

    expect(result.group.id).not.toBe(source.bundle.group.id);
    expect(members.map((member) => member.id)).not.toContain(selected.id);
    expect(categories.map((category) => category.id)).not.toContain(source.bundle.categories[0].id);
    expect(tags.map((tag) => tag.id)).not.toContain(source.bundle.tags[0].id);
    expect(expenses.map((expense) => expense.expenseId)).not.toContain(
      source.bundle.expenses[0].expenseId,
    );
    expect(attachments.map((attachment) => attachment.id)).not.toContain(
      source.bundle.attachments[0].id,
    );
    expect(members.find((member) => member.personId === localUser?.id)).toBeDefined();
    expect(
      expenses[0].transactions.paid.every((row) => members.some((m) => m.id === row.memberId)),
    ).toBe(true);
    expect(await attachments[0].blob.text()).toBe("receipt 1");
  });

  it("auto-numbers duplicate names and adds an existing local user when not listed", async () => {
    await db.localUser.add({ id: "self", name: "Local User", icon: "🦊" });
    await db.people.add({ id: "self", name: "Local User", icon: "🦊" });
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "existing-group",
    };
    await db.settings.put(onboarding);
    await db.groups.add({
      id: "existing-group",
      name: "Weekend Trip",
      icon: "🏕️",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: [],
    });
    const source = await buildGroupTransfer(createExportSource(), {
      categories: true,
      tags: false,
      members: true,
      expenses: false,
      attachments: false,
    });
    const first = await importGroupTransfer({ source, identity: { type: "new" } });
    const second = await importGroupTransfer({ source, identity: { type: "new" } });
    expect(first.group.name).toBe("Weekend Trip (2)");
    expect(second.group.name).toBe("Weekend Trip (3)");
    expect(await db.members.where("groupId").equals(first.group.id).count()).toBe(
      source.bundle.members.length + 1,
    );
    expect(await db.settings.get("onboarding")).toMatchObject({ groupId: "existing-group" });
  });

  it("rolls every write back when an import operation fails", async () => {
    const source = await buildGroupTransfer(createExportSource(), {
      categories: true,
      tags: true,
      members: true,
      expenses: true,
      attachments: false,
    });
    vi.spyOn(db.expenses, "bulkAdd").mockRejectedValueOnce(new Error("forced failure"));
    await expect(
      importGroupTransfer({
        source,
        identity: { type: "member", memberId: source.bundle.members[0].id },
      }),
    ).rejects.toThrow("forced failure");
    expect(await db.groups.count()).toBe(0);
    expect(await db.members.count()).toBe(0);
    expect(await db.expenses.count()).toBe(0);
    expect(await db.localUser.count()).toBe(0);
  });
});
