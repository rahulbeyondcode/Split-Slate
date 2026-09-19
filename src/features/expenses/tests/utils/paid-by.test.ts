import { describe, expect, it } from "vitest";

import { defaultPayer, rankPayers } from "@/features/expenses/utils/paid-by";

import type { Expense } from "@/shared/types/domain.types";

const MEMBERS = [
  { id: "b", name: "Bea" },
  { id: "a", name: "Amy" },
  { id: "c", name: "Cal" },
];
const expense = (id: string, createdAt: number, payer: string): Expense => ({
  expenseId: id,
  createdAt,
  when: 1,
  groupId: "g",
  expenseName: id,
  createdBy: "a",
  categoryId: "food",
  tagIds: [],
  attachmentIds: [],
  splitType: "equal",
  splitMeta: [],
  transactions: {
    paid: [{ memberId: payer, amount: 100 }],
    owes: [{ memberId: "a", amount: 100 }],
  },
});

describe("paid-by defaults and ranking", () => {
  it("starts with the creator and sorts unused members alphabetically", () => {
    expect(defaultPayer(MEMBERS, [], "b")).toBe("b");
    expect(rankPayers(MEMBERS, [])).toEqual(["a", "b", "c"]);
  });
  it("ranks by frequency, then name, capped at five", () => {
    expect(
      rankPayers(MEMBERS, [expense("1", 1, "b"), expense("2", 2, "b"), expense("3", 3, "c")]),
    ).toEqual(["b", "c", "a"]);
    expect(
      rankPayers(
        Array.from({ length: 7 }, (_, i) => ({ id: `${i}`, name: `${i}` })),
        [],
      ),
    ).toHaveLength(5);
  });
  it("preselects the last recorded payer even for a backdated expense", () => {
    expect(defaultPayer(MEMBERS, [expense("1", 2, "c"), expense("2", 1, "b")], "a")).toBe("c");
  });
  it("ignores removed and zero-contribution payers", () => {
    const input = expense("1", 1, "missing");
    input.transactions.paid.push({ memberId: "c", amount: 0 });
    expect(defaultPayer(MEMBERS, [input], "a")).toBe("a");
    expect(rankPayers(MEMBERS, [input])).toEqual(["a", "b", "c"]);
  });
});
