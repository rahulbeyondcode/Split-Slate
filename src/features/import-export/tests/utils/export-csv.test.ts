import { describe, expect, it } from "vitest";

import { buildGroupTransfer } from "@/features/import-export/utils/build-transfer";
import {
  createPortableGroupCsv,
  parsePortableGroupCsv,
} from "@/features/import-export/utils/export-csv";

import { createExportSource } from "@/features/import-export/tests/fixtures/transfer-fixture";

const selection = {
  categories: true,
  tags: true,
  members: true,
  expenses: true,
  attachments: false,
};

describe("portable group CSV", () => {
  it("round-trips manifests, Unicode, quoted content, and spreadsheet-safe text", async () => {
    const source = createExportSource();
    source.group.name = '=यात्रा, "special"\nline';
    source.people[0].name = "+Amy";
    const value = await buildGroupTransfer(source, selection);
    const csv = await createPortableGroupCsv(value.bundle);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("\t=यात्रा");
    expect(csv).toContain("\t+Amy");
    await expect(parsePortableGroupCsv(csv)).resolves.toEqual(value.bundle);
  });

  it("is deterministic regardless of source collection order", async () => {
    const source = createExportSource();
    const first = await createPortableGroupCsv(
      (await buildGroupTransfer(source, selection)).bundle,
    );
    source.people.reverse();
    source.members.reverse();
    source.categories.reverse();
    source.tags.reverse();
    const second = await createPortableGroupCsv(
      (await buildGroupTransfer(source, selection)).bundle,
    );
    expect(second).toBe(first);
  });

  it("rejects unsupported headers, versions, malformed cells, and tampering", async () => {
    await expect(parsePortableGroupCsv("wrong,header\n")).rejects.toThrow("header");
    const transfer = await buildGroupTransfer(createExportSource(), selection);
    const csv = await createPortableGroupCsv(transfer.bundle);
    await expect(
      parsePortableGroupCsv(csv.replace('"1","manifest"', '"2","manifest"')),
    ).rejects.toThrow("version");
    await expect(parsePortableGroupCsv('"schemaVersion')).rejects.toThrow("unterminated");
    await expect(
      parsePortableGroupCsv(csv.replace("Expense 1", "Changed expense")),
    ).rejects.toThrow("integrity");
  });
});
