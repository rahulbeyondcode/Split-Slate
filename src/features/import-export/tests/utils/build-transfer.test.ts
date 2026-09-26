import { describe, expect, it } from "vitest";

import { buildGroupTransfer } from "@/features/import-export/utils/build-transfer";
import { verifyPortableGroup } from "@/features/import-export/utils/transfer-integrity";

import {
  createExportSource,
  GROUP_ONLY_SELECTION,
} from "@/features/import-export/tests/fixtures/transfer-fixture";

describe("buildGroupTransfer", () => {
  it("starts with group information only and records source counts", async () => {
    const result = await buildGroupTransfer(
      createExportSource({ withAttachments: true }),
      GROUP_ONLY_SELECTION,
    );
    expect(result.bundle.manifest.includedCounts).toEqual({
      categories: 0,
      tags: 0,
      members: 0,
      expenses: 0,
      attachments: 0,
    });
    expect(result.bundle.manifest.sourceCounts.attachments).toBe(1);
    expect(result.bundle.group.frequentPayerIds).toEqual([]);
    await expect(verifyPortableGroup(result.bundle)).resolves.toEqual(result.bundle);
  });

  it("automatically includes member and category dependencies for expenses", async () => {
    const result = await buildGroupTransfer(createExportSource({ withAttachments: true }), {
      categories: false,
      tags: false,
      members: false,
      expenses: true,
      attachments: false,
    });
    expect(result.bundle.manifest.selection).toEqual({
      categories: true,
      tags: false,
      members: true,
      expenses: true,
      attachments: false,
    });
    expect(result.bundle.expenses[0].tagIds).toEqual([]);
    expect(result.bundle.expenses[0].attachmentIds).toEqual([]);
    expect(result.attachmentFiles).toEqual([]);
  });

  it("automatically includes the complete dependency chain for receipts", async () => {
    const result = await buildGroupTransfer(createExportSource({ withAttachments: true }), {
      categories: false,
      tags: false,
      members: false,
      expenses: false,
      attachments: true,
    });
    expect(result.bundle.manifest.selection).toMatchObject({
      categories: true,
      members: true,
      expenses: true,
      attachments: true,
    });
    expect(result.bundle.attachments).toHaveLength(1);
    expect(result.attachmentFiles).toHaveLength(1);
  });
});
