import { describe, expect, it } from "vitest";

import { buildGroupTransfer } from "@/features/import-export/utils/build-transfer";
import { createPortableGroupCsv } from "@/features/import-export/utils/export-csv";
import { createPortableGroupZip } from "@/features/import-export/utils/export-zip";
import { parseGroupTransferFile } from "@/features/import-export/utils/import-file";

import { createExportSource } from "@/features/import-export/tests/fixtures/transfer-fixture";

describe("parseGroupTransferFile", () => {
  it("parses CSV without receipt blobs", async () => {
    const source = await buildGroupTransfer(createExportSource(), {
      categories: true,
      tags: true,
      members: true,
      expenses: true,
      attachments: false,
    });
    const file = new File([await createPortableGroupCsv(source.bundle)], "group.csv");
    await expect(parseGroupTransferFile(file)).resolves.toEqual({
      bundle: source.bundle,
      attachmentFiles: [],
    });
  });

  it("parses ZIP with receipt blobs and rejects unknown files", async () => {
    const source = await buildGroupTransfer(createExportSource({ withAttachments: true }), {
      categories: true,
      tags: true,
      members: true,
      expenses: true,
      attachments: true,
    });
    const zip = new File([Uint8Array.from(await createPortableGroupZip(source))], "group.zip");
    const parsed = await parseGroupTransferFile(zip);
    expect(parsed.bundle).toEqual(source.bundle);
    expect(await parsed.attachmentFiles[0].blob.text()).toBe("receipt 1");
    await expect(parseGroupTransferFile(new File(["x"], "group.txt"))).rejects.toThrow(
      "CSV or ZIP",
    );
  });
});
