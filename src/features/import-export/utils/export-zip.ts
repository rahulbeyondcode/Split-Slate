import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { z } from "zod";

import {
  createPortableGroupCsv,
  parsePortableGroupCsv,
} from "@/features/import-export/utils/export-csv";
import {
  canonicalTransferJson,
  digestBytes,
  verifyPortableGroup,
} from "@/features/import-export/utils/transfer-integrity";

import type { GroupTransferSource } from "@/features/import-export/types/import-export.types";

const attachmentIndexSchema = z.array(
  z.object({
    id: z.string().min(1),
    expenseId: z.string().min(1),
    mimeType: z.string().min(1),
    path: z.string().regex(/^attachments\/[a-zA-Z0-9_-]+\.[a-z0-9]+$/u),
    sha256: z.string().regex(/^[0-9a-f]{64}$/u),
  }),
);

const extensionForMimeType = (mimeType: string): string => {
  const extensions: Record<string, string> = {
    "image/gif": "gif",
    "image/heic": "heic",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return extensions[mimeType.toLowerCase()] ?? "bin";
};

const safeSegment = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, "_");

export const createPortableGroupZip = async (source: GroupTransferSource): Promise<Uint8Array> => {
  const bundle = await verifyPortableGroup(source.bundle);
  const filesById = new Map(
    source.attachmentFiles.map((attachment) => [attachment.id, attachment]),
  );
  if (
    filesById.size !== bundle.attachments.length ||
    bundle.attachments.some((attachment) => !filesById.has(attachment.id))
  ) {
    throw new Error("Attachment files do not match the transfer manifest");
  }

  const archive: Record<string, Uint8Array> = {
    "manifest.json": strToU8(JSON.stringify(bundle, null, 2)),
    "group.csv": strToU8(await createPortableGroupCsv(bundle)),
    "README.txt": strToU8(
      [
        "Split Slate group transfer",
        "",
        "manifest.json contains the complete versioned transfer dataset.",
        "group.csv contains the same reconstructable data as typed CSV rows.",
        "attachments/index.json maps receipt IDs to verified files in this archive.",
        "Import this ZIP in Split Slate to create a new editable group.",
      ].join("\n"),
    ),
  };
  const attachmentIndex: z.infer<typeof attachmentIndexSchema> = [];

  for (const [index, metadata] of bundle.attachments.entries()) {
    const attachment = filesById.get(metadata.id)!;
    if (
      attachment.expenseId !== metadata.expenseId ||
      attachment.mimeType !== metadata.mimeType ||
      attachment.createdAt !== metadata.createdAt
    ) {
      throw new Error("Attachment file metadata does not match the transfer manifest");
    }
    const path = `attachments/${index + 1}-${safeSegment(metadata.id)}.${extensionForMimeType(metadata.mimeType)}`;
    const bytes = new Uint8Array(await attachment.blob.arrayBuffer());
    archive[path] = bytes;
    attachmentIndex.push({
      id: metadata.id,
      expenseId: metadata.expenseId,
      mimeType: metadata.mimeType,
      path,
      sha256: await digestBytes(bytes),
    });
  }
  archive["attachments/index.json"] = strToU8(JSON.stringify(attachmentIndex, null, 2));
  return zipSync(archive, { level: 6 });
};

export const parsePortableGroupZip = async (bytes: Uint8Array): Promise<GroupTransferSource> => {
  let archive: Record<string, Uint8Array>;
  try {
    archive = unzipSync(bytes);
  } catch {
    throw new Error("ZIP could not be opened");
  }
  for (const required of ["manifest.json", "group.csv", "attachments/index.json"]) {
    if (!archive[required]) throw new Error(`ZIP is missing ${required}`);
  }

  let manifestValue: unknown;
  let indexValue: unknown;
  try {
    manifestValue = JSON.parse(strFromU8(archive["manifest.json"]));
    indexValue = JSON.parse(strFromU8(archive["attachments/index.json"]));
  } catch {
    throw new Error("ZIP contains malformed JSON metadata");
  }
  const bundle = await verifyPortableGroup(manifestValue);
  const csvBundle = await parsePortableGroupCsv(strFromU8(archive["group.csv"]));
  if (canonicalTransferJson(csvBundle) !== canonicalTransferJson(bundle)) {
    throw new Error("ZIP manifest and CSV do not describe the same transfer");
  }
  const attachmentIndex = attachmentIndexSchema.parse(indexValue);
  if (attachmentIndex.length !== bundle.attachments.length) {
    throw new Error("ZIP attachment index does not match the transfer manifest");
  }

  const metadataById = new Map(bundle.attachments.map((attachment) => [attachment.id, attachment]));
  const expectedPaths = new Set([
    "manifest.json",
    "group.csv",
    "README.txt",
    "attachments/index.json",
    ...attachmentIndex.map((item) => item.path),
  ]);
  if (Object.keys(archive).some((path) => !expectedPaths.has(path))) {
    throw new Error("ZIP contains files not declared by the transfer manifest");
  }

  const attachmentFiles = [];
  for (const item of attachmentIndex) {
    const metadata = metadataById.get(item.id);
    const file = archive[item.path];
    if (
      !metadata ||
      !file ||
      metadata.expenseId !== item.expenseId ||
      metadata.mimeType !== item.mimeType
    ) {
      throw new Error("ZIP receipt metadata does not match the transfer manifest");
    }
    if ((await digestBytes(file)) !== item.sha256) {
      throw new Error("ZIP receipt integrity check failed");
    }
    attachmentFiles.push({
      ...metadata,
      blob: new Blob([Uint8Array.from(file)], { type: metadata.mimeType }),
    });
  }

  return { bundle, attachmentFiles };
};
