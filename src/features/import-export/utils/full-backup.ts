import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { z } from "zod";

import {
  type FullBackupSnapshot,
  type FullBackupSource,
  validateFullBackupData,
} from "@/features/import-export/utils/full-backup-schema";
import { digestBytes } from "@/features/import-export/utils/transfer-integrity";

import type { Attachment } from "@/shared/types/domain.types";

export const MAX_BACKUP_ZIP_BYTES = 256 * 1024 * 1024;
const MAX_BACKUP_JSON_BYTES = 32 * 1024 * 1024;
const MAX_BACKUP_EXPANDED_BYTES = 512 * 1024 * 1024;

export class GroupTransferFileError extends Error {}

const manifestSchema = z.strictObject({
  format: z.literal("split-slate-full-backup"),
  version: z.literal(1),
  dataSha256: z.string().regex(/^[0-9a-f]{64}$/u),
});

export const validateFullBackupSnapshot = async (snapshot: FullBackupSnapshot) => {
  const data = await validateFullBackupData(snapshot.data);
  const files = new Map(snapshot.attachments.map((item) => [item.id, item]));
  if (
    files.size !== data.attachments.length ||
    snapshot.attachments.length !== data.attachments.length
  ) {
    throw new Error("Backup receipt files do not match the manifest");
  }
  for (const metadata of data.attachments) {
    const file = files.get(metadata.id);
    if (
      !file ||
      file.expenseId !== metadata.expenseId ||
      file.mimeType !== metadata.mimeType ||
      file.createdAt !== metadata.createdAt ||
      file.blob.size !== metadata.size ||
      (await digestBytes(new Uint8Array(await file.blob.arrayBuffer()))) !== metadata.sha256
    ) {
      throw new Error("Backup receipt integrity check failed");
    }
  }
  return { data, attachments: snapshot.attachments };
};

export const createFullBackupZip = async (
  source: FullBackupSource,
  theme: "light" | "dark",
): Promise<Uint8Array> => {
  const archive: Record<string, Uint8Array> = {};
  const attachments = [];
  let totalBytes = 0;
  for (const [index, attachment] of source.attachments.entries()) {
    if (totalBytes + attachment.blob.size > MAX_BACKUP_EXPANDED_BYTES) {
      throw new Error("Backup is too large");
    }
    const bytes = new Uint8Array(await attachment.blob.arrayBuffer());
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_BACKUP_EXPANDED_BYTES) throw new Error("Backup is too large");
    const path = `receipts/${index + 1}.bin`;
    archive[path] = bytes;
    attachments.push({
      id: attachment.id,
      expenseId: attachment.expenseId,
      mimeType: attachment.mimeType,
      createdAt: attachment.createdAt,
      path,
      size: bytes.byteLength,
      sha256: await digestBytes(bytes),
    });
  }
  const data = await validateFullBackupData({
    format: "split-slate-full-backup",
    version: 1,
    createdAt: Date.now(),
    theme,
    localUser: source.localUser,
    groups: source.groups,
    people: source.people,
    members: source.members,
    categories: source.categories,
    tags: source.tags,
    expenses: source.expenses,
    activityEvents: source.activityEvents,
    attachments,
    settings: source.settings,
  });
  const dataBytes = strToU8(JSON.stringify(data));
  if (
    dataBytes.byteLength > MAX_BACKUP_JSON_BYTES ||
    totalBytes + dataBytes.byteLength > MAX_BACKUP_EXPANDED_BYTES
  ) {
    throw new Error("Backup is too large");
  }
  archive["backup.json"] = dataBytes;
  archive["manifest.json"] = strToU8(
    JSON.stringify({
      format: "split-slate-full-backup",
      version: 1,
      dataSha256: await digestBytes(dataBytes),
    }),
  );
  archive["README.txt"] = strToU8(
    "SplitSlate whole-app backup. Restore this ZIP in SplitSlate to replace all app data on a device. Keep this unencrypted file private.",
  );
  const zip = zipSync(archive, { level: 6 });
  if (zip.byteLength > MAX_BACKUP_ZIP_BYTES) throw new Error("Backup is too large");
  return zip;
};

export const parseFullBackupZip = async (bytes: Uint8Array): Promise<FullBackupSnapshot> => {
  if (bytes.byteLength > MAX_BACKUP_ZIP_BYTES) throw new Error("Backup ZIP is too large");
  let expandedBytes = 0;
  let entryCount = 0;
  const seen = new Set<string>();
  let unsafeEntry = false;
  let groupTransfer = false;
  let archive: Record<string, Uint8Array>;
  try {
    archive = unzipSync(bytes, {
      filter: ({ name, originalSize }) => {
        if (name === "group.csv" || name === "attachments/index.json") {
          groupTransfer = true;
        }
        entryCount += 1;
        expandedBytes += originalSize;
        if (
          entryCount > 10_000 ||
          expandedBytes > MAX_BACKUP_EXPANDED_BYTES ||
          (name === "backup.json" && originalSize > MAX_BACKUP_JSON_BYTES) ||
          (["manifest.json", "README.txt"].includes(name) && originalSize > 4096) ||
          seen.has(name) ||
          !(
            ["backup.json", "manifest.json", "README.txt"].includes(name) ||
            /^receipts\/[1-9]\d*\.bin$/u.test(name)
          )
        ) {
          unsafeEntry = true;
          return false;
        }
        seen.add(name);
        return true;
      },
    });
  } catch (failure) {
    throw new Error("Backup ZIP could not be opened", { cause: failure });
  }
  if (groupTransfer) {
    throw new GroupTransferFileError("This ZIP contains a group transfer, not an app backup.");
  }
  if (!archive["backup.json"] || !archive["manifest.json"]) {
    throw new Error(
      "This ZIP is not a SplitSlate app backup. Download one from Settings, or use Import group for a single group.",
    );
  }
  if (unsafeEntry) throw new Error("Backup ZIP contains unsupported or excessive files");
  if (
    archive["backup.json"].byteLength > MAX_BACKUP_JSON_BYTES ||
    archive["manifest.json"].byteLength > 4096 ||
    (archive["README.txt"]?.byteLength ?? 0) > 4096
  ) {
    throw new Error("Backup ZIP is too large");
  }
  if (
    Object.values(archive).reduce((sum, file) => sum + file.byteLength, 0) >
    MAX_BACKUP_EXPANDED_BYTES
  ) {
    throw new Error("Backup ZIP is too large");
  }
  let dataValue: unknown;
  let manifestValue: unknown;
  try {
    dataValue = JSON.parse(strFromU8(archive["backup.json"]));
    manifestValue = JSON.parse(strFromU8(archive["manifest.json"]));
  } catch {
    throw new Error("Backup metadata is malformed");
  }
  const manifest = manifestSchema.safeParse(manifestValue);
  if (!manifest.success) {
    throw new Error(
      "This ZIP is not a supported SplitSlate app backup. Download a new backup from Settings.",
    );
  }
  if ((await digestBytes(archive["backup.json"])) !== manifest.data.dataSha256) {
    throw new Error("Backup integrity check failed");
  }
  let data: FullBackupSnapshot["data"];
  try {
    data = await validateFullBackupData(dataValue);
  } catch (failure) {
    throw new Error("Backup data is invalid or incomplete. Nothing was changed.", {
      cause: failure,
    });
  }
  const expectedPaths = new Set([
    "backup.json",
    "manifest.json",
    "README.txt",
    ...data.attachments.map((item) => item.path),
  ]);
  if (Object.keys(archive).some((path) => !expectedPaths.has(path))) {
    throw new Error("Backup ZIP contains undeclared files");
  }
  const files: Attachment[] = data.attachments.map((item) => {
    const file = archive[item.path];
    if (!file || file.byteLength !== item.size) throw new Error("Backup receipt is missing");
    return {
      id: item.id,
      expenseId: item.expenseId,
      mimeType: item.mimeType,
      createdAt: item.createdAt,
      blob: new Blob([Uint8Array.from(file)], { type: item.mimeType }),
    };
  });
  return validateFullBackupSnapshot({ data, attachments: files });
};
