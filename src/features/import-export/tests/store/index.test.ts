import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { importGroupTransfer, readGroupExportSource } from "@/features/import-export/store";
import { buildGroupTransfer } from "@/features/import-export/utils/build-transfer";
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
