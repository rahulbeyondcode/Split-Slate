import { describe, expect, it } from "vitest";

import { buildGroupTransfer } from "@/features/import-export/utils/build-transfer";
import { compactLinkIds } from "@/features/import-export/utils/compact-link-ids";
import { verifyPortableGroup } from "@/features/import-export/utils/transfer-integrity";

import type { GroupExportSource } from "@/features/import-export/types/import-export.types";

import {
  COMPLETE_SELECTION,
  createExportSource,
  createTransfer,
  GROUP_ONLY_SELECTION,
} from "@/features/import-export/tests/fixtures/transfer-fixture";

describe("compact link IDs", () => {
  it("remaps all group-owned IDs and references while keeping Person IDs", async () => {
    const { bundle } = await createTransfer();
    const compact = await compactLinkIds(bundle);
    await expect(verifyPortableGroup(compact)).resolves.toEqual(compact);
    expect(compact.people).toEqual(bundle.people);
    expect(compact.group.id).toBe("1");
    expect(compact.group.frequentPayerIds).toEqual(compact.members.map((member) => member.id));
    expect(compact.members.every((member) => member.groupId === compact.group.id)).toBe(true);
    expect(compact.members.map((member) => member.personId)).toEqual(
      bundle.members.map((member) => member.personId),
    );
    expect(compact.expenses[0].transactions.paid[0].memberId).toBe(compact.members[0].id);
    expect(compact.expenses[0].categoryId).toBe(compact.categories[0].id);
    expect(compact.expenses[0].tagIds).toEqual(compact.tags.map((tag) => tag.id));
    expect(compact.expenses[0].expenseId).not.toBe(bundle.expenses[0].expenseId);
    expect(compact.manifest.integrity.digest).not.toBe(bundle.manifest.integrity.digest);
  });

  it("also compacts a group-only snapshot", async () => {
    const { bundle } = await createTransfer(GROUP_ONLY_SELECTION);
    const compact = await compactLinkIds(bundle);
    expect(compact.group.id).toBe("1");
    await expect(verifyPortableGroup(compact)).resolves.toEqual(compact);
  });

  it("rewrites split metadata and receipt references as part of the same mapping", async () => {
    const source: GroupExportSource = createExportSource({ withAttachments: true });
    source.expenses[0].splitType = "shares";
    source.expenses[0].splitMeta = source.members.map((member) => ({
      memberId: member.id,
      value: "1",
    }));
    const { bundle } = await buildGroupTransfer(source, COMPLETE_SELECTION);
    const compact = await compactLinkIds(bundle);
    await expect(verifyPortableGroup(compact)).resolves.toEqual(compact);
    expect(compact.expenses[0].splitMeta.map((row) => row.memberId)).toEqual(
      compact.members.map((member) => member.id),
    );
    expect(compact.expenses[0].attachmentIds).toEqual([compact.attachments[0].id]);
    expect(compact.attachments[0].expenseId).toBe(compact.expenses[0].expenseId);
  });
});
