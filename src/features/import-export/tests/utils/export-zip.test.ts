import { strFromU8, unzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { buildGroupTransfer } from "@/features/import-export/utils/build-transfer";
import {
  createPortableGroupZip,
  parsePortableGroupZip,
} from "@/features/import-export/utils/export-zip";

import {
  createExportSource,
  GROUP_ONLY_SELECTION,
} from "@/features/import-export/tests/fixtures/transfer-fixture";

describe("portable group ZIP", () => {
  it("round-trips the verified manifest, CSV, index, and receipt files", async () => {
    const source = await buildGroupTransfer(createExportSource({ withAttachments: true }), {
      categories: true,
      tags: true,
      members: true,
      expenses: true,
      attachments: true,
    });
    const bytes = await createPortableGroupZip(source);
    const archive = unzipSync(bytes);
    expect(Object.keys(archive).sort()).toEqual([
      "README.txt",
      "attachments/1-attachment-0001-12345678-90ab-cdef.jpg",
      "attachments/index.json",
      "group.csv",
      "manifest.json",
    ]);
    expect(strFromU8(archive["README.txt"])).toContain("new editable group");
    const parsed = await parsePortableGroupZip(bytes);
    expect(parsed.bundle).toEqual(source.bundle);
    expect(await parsed.attachmentFiles[0].blob.text()).toBe("receipt 1");
  });

  it("supports ZIP transfers without receipts", async () => {
    const source = await buildGroupTransfer(createExportSource(), GROUP_ONLY_SELECTION);
    const parsed = await parsePortableGroupZip(await createPortableGroupZip(source));
    expect(parsed.bundle).toEqual(source.bundle);
    expect(parsed.attachmentFiles).toEqual([]);
  });

  it("rejects missing, surplus, and corrupted attachment files", async () => {
    const source = await buildGroupTransfer(createExportSource({ withAttachments: true }), {
      categories: true,
      tags: true,
      members: true,
      expenses: true,
      attachments: true,
    });
    await expect(createPortableGroupZip({ ...source, attachmentFiles: [] })).rejects.toThrow(
      "do not match",
    );
    await expect(
      createPortableGroupZip({
        ...source,
        attachmentFiles: [
          ...source.attachmentFiles,
          { ...source.attachmentFiles[0], id: "surplus" },
        ],
      }),
    ).rejects.toThrow("do not match");

    const archive = unzipSync(await createPortableGroupZip(source));
    const receiptPath = Object.keys(archive).find((path) => path.startsWith("attachments/1-"))!;
    archive[receiptPath] = new TextEncoder().encode("corrupt");
    await expect(parsePortableGroupZip(zipSync(archive))).rejects.toThrow("integrity");
  });
});
