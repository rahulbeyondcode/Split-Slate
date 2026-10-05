import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { buildGroupTransfer } from "@/features/import-export/utils/build-transfer";
import { createPortableGroupZip } from "@/features/import-export/utils/export-zip";
import {
  createFullBackupZip,
  GroupTransferFileError,
  parseFullBackupZip,
} from "@/features/import-export/utils/full-backup";
import type { FullBackupSource } from "@/features/import-export/utils/full-backup-schema";
import { digestBytes } from "@/features/import-export/utils/transfer-integrity";

import {
  SEED_DEFAULT_GROUP_CATEGORIES,
  SEED_MASTER_CATEGORIES,
} from "@/shared/constants/categories";

import {
  COMPLETE_SELECTION,
  createExportSource,
} from "@/features/import-export/tests/fixtures/transfer-fixture";

const backupSource = (): FullBackupSource => {
  const group = createExportSource({ withAttachments: true, expenseCount: 2 });
  return {
    activityEvents: [],
    localUser: [{ ...group.people[0] }],
    groups: [group.group],
    people: group.people,
    members: group.members,
    categories: group.categories,
    tags: group.tags,
    expenses: group.expenses,
    attachments: group.attachmentFiles,
    settings: [
      { id: "onboarding", complete: true, lastCompletedStep: "members", groupId: group.group.id },
      { id: "categories", master: SEED_MASTER_CATEGORIES, default: SEED_DEFAULT_GROUP_CATEGORIES },
    ],
  };
};

describe("whole-app backup ZIP", () => {
  it("round-trips every table, receipts, identity, and theme in one archive", async () => {
    const source = backupSource();
    const zip = await createFullBackupZip(source, "dark");
    const restored = await parseFullBackupZip(zip);
    expect(restored.data.format).toBe("split-slate-full-backup");
    expect(restored.data.theme).toBe("dark");
    expect(restored.data.groups).toEqual(source.groups);
    expect(restored.data.people).toEqual(source.people);
    expect(restored.data.expenses).toEqual(source.expenses);
    expect(restored.data.settings).toEqual(source.settings);
    expect(await Promise.all(restored.attachments.map((file) => file.blob.text()))).toEqual([
      "receipt 1",
      "receipt 2",
    ]);
  });

  it("rejects missing, unexpected, tampered, and unsupported content", async () => {
    const files = unzipSync(await createFullBackupZip(backupSource(), "light"));
    const removed = { ...files };
    delete removed["receipts/1.bin"];
    await expect(parseFullBackupZip(zipSync(removed))).rejects.toThrow("receipt is missing");

    const added = { ...files, "other.txt": strToU8("extra") };
    await expect(parseFullBackupZip(zipSync(added))).rejects.toThrow("unsupported or excessive");

    const tamperedData = { ...files, "backup.json": strToU8("{}") };
    await expect(parseFullBackupZip(zipSync(tamperedData))).rejects.toThrow("integrity");

    const tamperedReceipt = { ...files, "receipts/1.bin": strToU8("not the receipt") };
    await expect(parseFullBackupZip(zipSync(tamperedReceipt))).rejects.toThrow("receipt");

    const invalidVersion = {
      ...files,
      "manifest.json": strToU8(
        JSON.stringify({
          format: "split-slate-full-backup",
          version: 2,
          dataSha256: await digestBytes(files["backup.json"]),
        }),
      ),
    };
    await expect(parseFullBackupZip(zipSync(invalidVersion))).rejects.toThrow();
    expect(JSON.parse(strFromU8(files["backup.json"])).version).toBe(1);
  });

  it("rejects a validly hashed archive with broken cross-group references", async () => {
    const files = unzipSync(await createFullBackupZip(backupSource(), "light"));
    const data = JSON.parse(strFromU8(files["backup.json"]));
    data.expenses[0].createdBy = "missing-member";
    const dataBytes = strToU8(JSON.stringify(data));
    const corrupt = {
      ...files,
      "backup.json": dataBytes,
      "manifest.json": strToU8(
        JSON.stringify({
          format: "split-slate-full-backup",
          version: 1,
          dataSha256: await digestBytes(dataBytes),
        }),
      ),
    };
    await expect(parseFullBackupZip(zipSync(corrupt))).rejects.toThrow();
  });

  it("does not confuse a single-group transfer ZIP with a device backup", async () => {
    const transfer = await buildGroupTransfer(createExportSource(), COMPLETE_SELECTION);
    await expect(parseFullBackupZip(await createPortableGroupZip(transfer))).rejects.toThrow(
      GroupTransferFileError,
    );
  });

  it("accepts a renamed backup and rejects unrelated ZIPs with actionable guidance", async () => {
    // The parser receives bytes only; archive name is not part of the backup format.
    const renamed = await createFullBackupZip(backupSource(), "light");
    await expect(parseFullBackupZip(renamed)).resolves.toMatchObject({ data: { theme: "light" } });
    await expect(parseFullBackupZip(zipSync({ "notes.txt": strToU8("hello") }))).rejects.toThrow(
      "not a SplitSlate app backup",
    );
  });

  it("round-trips a completed device after its last group is removed", async () => {
    const source = backupSource();
    const empty: FullBackupSource = {
      ...source,
      groups: [],
      members: [],
      categories: [],
      tags: [],
      expenses: [],
      attachments: [],
      settings: source.settings.map((row) =>
        row.id === "onboarding" ? { ...row, groupId: null } : row,
      ),
    };
    const restored = await parseFullBackupZip(await createFullBackupZip(empty, "dark"));
    expect(restored.data.groups).toEqual([]);
    expect(restored.data.people).toEqual(source.people);
    expect(restored.data.settings).toEqual(empty.settings);
  });

  it("round-trips a replacement group without rewriting completed onboarding", async () => {
    const source = backupSource();
    source.settings = source.settings.map((row) =>
      row.id === "onboarding" ? { ...row, groupId: null } : row,
    );

    const restored = await parseFullBackupZip(await createFullBackupZip(source, "light"));
    expect(restored.data.groups).toEqual(source.groups);
    expect(restored.data.settings).toEqual(source.settings);
    expect(restored.data.expenses).toEqual(source.expenses);
  });

  it("rejects a non-null onboarding reference to a missing group", async () => {
    const source = backupSource();
    source.settings = source.settings.map((row) =>
      row.id === "onboarding" ? { ...row, groupId: "missing-group" } : row,
    );

    await expect(createFullBackupZip(source, "light")).rejects.toThrow(
      "Backup onboarding group is missing",
    );
  });
});
