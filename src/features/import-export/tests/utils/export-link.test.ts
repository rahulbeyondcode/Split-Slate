import { describe, expect, it } from "vitest";

import { buildGroupTransfer } from "@/features/import-export/utils/build-transfer";
import {
  createTransferLink,
  decodeTransferPayload,
  encodeTransferPayload,
  TransferLinkTooLargeError,
} from "@/features/import-export/utils/export-link";

import {
  createExportSource,
  createTransfer,
  GROUP_ONLY_SELECTION,
} from "@/features/import-export/tests/fixtures/transfer-fixture";

const incompressibleText = (byteLength: number): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

describe("transfer links", () => {
  it("round-trips validated Unicode data through an import URL", async () => {
    const value = await createTransfer();
    value.bundle.group.name = "गोवा 🏖️ Trip";
    const resealed = await buildGroupTransfer(
      { ...createExportSource(), group: { ...createExportSource().group, name: "गोवा 🏖️ Trip" } },
      value.bundle.manifest.selection,
    );
    const payload = await encodeTransferPayload(resealed.bundle);
    expect(payload).toMatch(/^v1\.[A-Za-z0-9_-]+$/u);
    await expect(decodeTransferPayload(`#${payload}`)).resolves.toEqual(resealed.bundle);
    await expect(createTransferLink(resealed.bundle, "https://example.com/app/")).resolves.toMatch(
      /^https:\/\/example\.com\/app\/import#v1\./u,
    );
  });

  it("rejects malformed, unsupported, oversized, and integrity-invalid payloads", async () => {
    await expect(decodeTransferPayload("#v2.abc")).rejects.toThrow("Unsupported");
    await expect(decodeTransferPayload("#v1.not+base64url")).rejects.toThrow(
      "could not be decoded",
    );
    await expect(decodeTransferPayload(`#${"x".repeat(32_001)}`)).rejects.toThrow("too large");
    const value = await createTransfer();
    value.bundle.group.name = "Tampered";
    await expect(encodeTransferPayload(value.bundle)).rejects.toThrow("integrity");
  });

  it("guarantees the agreed 25-member, 25-category, 25-tag, 50-expense target fits", async () => {
    const source = createExportSource({
      memberCount: 25,
      categoryCount: 25,
      tagCount: 25,
      expenseCount: 50,
    });
    const transfer = await buildGroupTransfer(source, {
      categories: true,
      tags: true,
      members: true,
      expenses: true,
      attachments: false,
    });
    const link = await createTransferLink(transfer.bundle, "https://example.com/");
    expect(link.length).toBeLessThanOrEqual(32_000);
    await expect(decodeTransferPayload(new URL(link).hash)).resolves.toEqual(transfer.bundle);
  });

  it("falls back to files when the actual compressed link exceeds 32k", async () => {
    const source = createExportSource({ expenseCount: 0 });
    source.group.name = incompressibleText(50_000);
    const transfer = await buildGroupTransfer(source, GROUP_ONLY_SELECTION);
    await expect(createTransferLink(transfer.bundle, "https://example.com/")).rejects.toThrow(
      TransferLinkTooLargeError,
    );
  });

  it("does not create links containing receipt files", async () => {
    const transfer = await buildGroupTransfer(createExportSource({ withAttachments: true }), {
      categories: true,
      tags: true,
      members: true,
      expenses: true,
      attachments: true,
    });
    await expect(createTransferLink(transfer.bundle, "https://example.com/")).rejects.toThrow(
      "ZIP",
    );
  });
});
