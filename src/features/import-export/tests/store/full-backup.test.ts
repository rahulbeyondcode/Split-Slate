import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readFullBackupSource, restoreFullBackup } from "@/features/import-export/store";
import {
  createFullBackupZip,
  parseFullBackupZip,
} from "@/features/import-export/utils/full-backup";
import type { FullBackupSnapshot } from "@/features/import-export/utils/full-backup-schema";
import { db } from "@/shared/configs/db";

import {
  SEED_DEFAULT_GROUP_CATEGORIES,
  SEED_MASTER_CATEGORIES,
} from "@/shared/constants/categories";
import type { SettingsRecord } from "@/shared/types/domain.types";

import { createExportSource } from "@/features/import-export/tests/fixtures/transfer-fixture";

const seedDevice = async () => {
  const source = createExportSource({ withAttachments: true });
  await db.localUser.add({ ...source.people[0] });
  await db.groups.add(source.group);
  await db.people.bulkAdd(source.people);
  await db.members.bulkAdd(source.members);
  await db.categories.bulkAdd(source.categories);
  await db.tags.bulkAdd(source.tags);
  await db.expenses.bulkAdd(source.expenses);
  await db.attachments.bulkAdd(source.attachmentFiles);
  const settings: SettingsRecord[] = [
    { id: "onboarding", complete: true, lastCompletedStep: "members", groupId: source.group.id },
    { id: "categories", master: SEED_MASTER_CATEGORIES, default: SEED_DEFAULT_GROUP_CATEGORIES },
  ];
  await db.settings.bulkAdd(settings);
};

beforeEach(async () => {
  await db.delete();
  await db.open();
  await seedDevice();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});

const capturedBackup = async (): Promise<FullBackupSnapshot> =>
  parseFullBackupZip(await createFullBackupZip(await readFullBackupSource(), "dark"));

describe("whole-app backup persistence", () => {
  it("replaces all old data with the snapshot while preserving IDs and receipt bytes", async () => {
    await db.groups.add({
      id: "second-trip",
      name: "Second Trip",
      icon: "🏖️",
      currency: "USD",
      createdAt: 2,
      frequentPayerIds: ["second-member"],
    });
    await db.members.add({
      id: "second-member",
      groupId: "second-trip",
      personId: (await db.localUser.toCollection().first())!.id,
    });
    await db.categories.add({
      id: "second-food",
      groupId: "second-trip",
      name: "Food",
      icon: "🍽️",
      isActive: true,
    });
    await db.expenses.add({
      expenseId: "second-expense",
      groupId: "second-trip",
      expenseName: "Lunch",
      categoryId: "second-food",
      createdBy: "second-member",
      createdAt: 3,
      when: 4,
      splitType: "equal",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: "second-member", amount: 1200 }],
        owes: [{ memberId: "second-member", amount: 1200 }],
      },
    });
    const original = await readFullBackupSource();
    const snapshot = await capturedBackup();
    await db.groups.add({
      id: "other",
      name: "Other",
      icon: "🧳",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: [],
    });
    await db.people.add({ id: "stranger", name: "Stranger", icon: "🐱" });
    const incomplete: SettingsRecord = {
      id: "onboarding",
      complete: false,
      lastCompletedStep: null,
      groupId: null,
    };
    await db.settings.put(incomplete);

    await restoreFullBackup(snapshot);
    const restored = await readFullBackupSource();
    expect(restored.groups).toEqual(original.groups);
    expect(restored.people).toEqual(original.people);
    expect(restored.members).toEqual(original.members);
    expect(restored.categories).toEqual(original.categories);
    expect(restored.tags).toEqual(original.tags);
    expect(restored.expenses).toEqual(original.expenses);
    expect(restored.settings).toEqual(original.settings);
    expect(restored.localUser).toEqual(original.localUser);
    expect(restored.groups).toHaveLength(2);
    expect(await restored.attachments[0].blob.text()).toBe("receipt 1");
  });

  it("restores the same ZIP onto a fresh, empty database", async () => {
    const snapshot = await capturedBackup();
    await db.delete();
    await db.open();
    await restoreFullBackup(snapshot);
    expect(await db.groups.count()).toBe(snapshot.data.groups.length);
    expect(await db.localUser.toCollection().first()).toMatchObject(snapshot.data.localUser[0]);
    expect(await db.settings.get("onboarding")).toMatchObject({ complete: true });
  });

  it("leaves existing data untouched when validation fails", async () => {
    const snapshot = await capturedBackup();
    snapshot.data.groups[0].frequentPayerIds = ["missing-member"];
    await expect(restoreFullBackup(snapshot)).rejects.toThrow();
    expect(await db.groups.count()).toBe(1);
    expect(await db.expenses.count()).toBe(1);
  });

  it("rolls the clears and writes back when restoration fails", async () => {
    const snapshot = await capturedBackup();
    await db.groups.add({
      id: "keep",
      name: "Keep",
      icon: "🐼",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: [],
    });
    vi.spyOn(db.expenses, "bulkAdd").mockRejectedValueOnce(new Error("forced restore failure"));
    await expect(restoreFullBackup(snapshot)).rejects.toThrow("forced restore failure");
    expect((await db.groups.toArray()).map((group) => group.id).sort()).toEqual([
      "group-0001-12345678-90ab-cdef",
      "keep",
    ]);
    expect(await db.expenses.count()).toBe(1);
    expect(await db.people.count()).toBe(2);
    expect(await db.attachments.count()).toBe(1);
  });
});
