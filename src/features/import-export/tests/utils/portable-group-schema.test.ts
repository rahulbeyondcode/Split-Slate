import { describe, expect, it } from "vitest";

import { portableGroupSchema } from "@/features/import-export/utils/portable-group-schema";

import {
  createTransfer,
  GROUP_ONLY_SELECTION,
} from "@/features/import-export/tests/fixtures/transfer-fixture";

describe("portable group schema", () => {
  it("accepts complete and group-only transfer datasets", async () => {
    const complete = await createTransfer();
    const groupOnly = await createTransfer(GROUP_ONLY_SELECTION);
    expect(portableGroupSchema.parse(complete.bundle)).toEqual(complete.bundle);
    expect(portableGroupSchema.parse(groupOnly.bundle)).toEqual(groupOnly.bundle);
    expect(groupOnly.bundle.members).toEqual([]);
    expect(groupOnly.bundle.categories).toEqual([]);
  });

  it.each([
    [
      "missing person",
      (value: Awaited<ReturnType<typeof createTransfer>>["bundle"]) => (value.people = []),
    ],
    [
      "foreign category",
      (value: Awaited<ReturnType<typeof createTransfer>>["bundle"]) =>
        (value.categories[0].groupId = "other"),
    ],
    [
      "missing expense tag",
      (value: Awaited<ReturnType<typeof createTransfer>>["bundle"]) =>
        (value.expenses[0].tagIds = ["missing"]),
    ],
    [
      "unbalanced expense",
      (value: Awaited<ReturnType<typeof createTransfer>>["bundle"]) =>
        (value.expenses[0].transactions.owes[0].amount -= 1),
    ],
    [
      "incorrect manifest count",
      (value: Awaited<ReturnType<typeof createTransfer>>["bundle"]) =>
        (value.manifest.includedCounts.expenses += 1),
    ],
  ])("rejects %s", async (_name, mutate) => {
    const value = structuredClone((await createTransfer()).bundle);
    mutate(value);
    expect(portableGroupSchema.safeParse(value).success).toBe(false);
  });

  it("requires every attachment reference and metadata record to agree", async () => {
    const value = structuredClone(
      (
        await createTransfer(
          { categories: true, tags: true, members: true, expenses: true, attachments: true },
          { withAttachments: true },
        )
      ).bundle,
    );
    expect(portableGroupSchema.safeParse(value).success).toBe(true);
    value.attachments = [];
    value.manifest.includedCounts.attachments = 0;
    expect(portableGroupSchema.safeParse(value).success).toBe(false);
  });

  it("accepts legacy decimal ratio numbers but rejects invalid current ratio text", async () => {
    const value = structuredClone((await createTransfer()).bundle);
    value.expenses[0].splitType = "shares";
    value.expenses[0].splitMeta = value.expenses[0].transactions.owes.map((row) => ({
      memberId: row.memberId,
      value: 1.5,
    }));
    expect(portableGroupSchema.safeParse(value).success).toBe(true);
    value.expenses[0].splitMeta[0].value = "not-a-ratio";
    expect(portableGroupSchema.safeParse(value).success).toBe(false);
  });

  it("rejects group spending beyond the aggregate safe-integer limit", async () => {
    const value = structuredClone((await createTransfer()).bundle);
    const first = value.expenses[0];
    first.transactions.paid[0].amount = Number.MAX_SAFE_INTEGER;
    first.transactions.owes = [
      { memberId: first.transactions.owes[0].memberId, amount: Number.MAX_SAFE_INTEGER },
    ];
    value.expenses.push({
      ...structuredClone(first),
      expenseId: "second-expense",
      transactions: {
        paid: [{ memberId: first.createdBy, amount: 1 }],
        owes: [{ memberId: first.transactions.owes[0].memberId, amount: 1 }],
      },
    });
    value.manifest.sourceCounts.expenses += 1;
    value.manifest.includedCounts.expenses += 1;
    expect(portableGroupSchema.safeParse(value).success).toBe(false);
  });
});
