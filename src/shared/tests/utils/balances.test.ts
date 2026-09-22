import { describe, expect, it } from "vitest";

import {
  calculateBalances,
  calculateGroupTotal,
  calculateMemberNet,
  suggestTransfers,
} from "@/shared/utils/balances";

import type { Expense, Transaction } from "@/shared/types/domain.types";

interface ExpenseData {
  id: string;
  paid: Transaction[];
  owes: Transaction[];
}

const createExpense = ({ id, paid, owes }: ExpenseData): Expense => ({
  expenseId: id,
  groupId: "group-1",
  expenseName: id,
  createdBy: paid[0]?.memberId ?? "member-a",
  categoryId: "category-1",
  createdAt: 1,
  when: 1,
  splitType: "equal",
  splitMeta: [],
  transactions: { paid, owes },
  tagIds: [],
  attachmentIds: [],
});

const EXPENSES: Expense[] = [
  createExpense({
    id: "dinner",
    paid: [{ memberId: "member-a", amount: 10_000 }],
    owes: [
      { memberId: "member-a", amount: 2_500 },
      { memberId: "member-b", amount: 2_500 },
      { memberId: "member-c", amount: 5_000 },
    ],
  }),
  createExpense({
    id: "taxi",
    paid: [
      { memberId: "member-a", amount: 1_000 },
      { memberId: "member-b", amount: 3_000 },
    ],
    owes: [
      { memberId: "member-a", amount: 2_000 },
      { memberId: "member-b", amount: 2_000 },
    ],
  }),
];

describe("calculateMemberNet", () => {
  it("returns zero when there are no expenses", () => {
    expect(calculateMemberNet([], "member-a")).toBe(0);
  });

  it("subtracts everything a member owes from everything they paid", () => {
    expect(calculateMemberNet(EXPENSES, "member-a")).toBe(6_500);
    expect(calculateMemberNet(EXPENSES, "member-b")).toBe(-1_500);
    expect(calculateMemberNet(EXPENSES, "member-c")).toBe(-5_000);
  });

  it("ignores transactions assigned to other members", () => {
    expect(calculateMemberNet(EXPENSES, "member-d")).toBe(0);
  });
});

describe("calculateGroupTotal", () => {
  it("returns zero when there are no expenses", () => {
    expect(calculateGroupTotal([])).toBe(0);
  });

  it("sums every payer contribution across all expenses", () => {
    expect(calculateGroupTotal(EXPENSES)).toBe(14_000);
  });
});

describe("calculateBalances", () => {
  it("includes uninvolved members with zero balance", () => {
    expect([
      ...calculateBalances(EXPENSES, ["member-a", "member-b", "member-c", "member-d"]),
    ]).toEqual([
      ["member-a", 6500],
      ["member-b", -1500],
      ["member-c", -5000],
      ["member-d", 0],
    ]);
  });
  it("supports empty and solo groups", () => {
    expect([...calculateBalances([], [])]).toEqual([]);
    const solo = createExpense({
      id: "solo",
      paid: [{ memberId: "a", amount: 1 }],
      owes: [{ memberId: "a", amount: 1 }],
    });
    expect([...calculateBalances([solo], ["a"])]).toEqual([["a", 0]]);
  });
  it("rejects dangling member references", () => {
    expect(() => calculateBalances(EXPENSES, ["member-a"])).toThrow("missing member");
  });
  it.each([-1, 0.1, Number.MAX_SAFE_INTEGER + 1])("rejects invalid allocation %s", (amount) => {
    const expense = createExpense({ id: "bad", paid: [{ memberId: "a", amount }], owes: [] });
    expect(() => calculateBalances([expense], ["a"])).toThrow("Invalid expense amount");
  });
  it("stays exact at the maximum supported total", () => {
    const expenses = [
      createExpense({
        id: "max",
        paid: [{ memberId: "a", amount: Number.MAX_SAFE_INTEGER }],
        owes: [{ memberId: "b", amount: Number.MAX_SAFE_INTEGER }],
      }),
    ];
    const balances = calculateBalances(expenses, ["a", "b"]);
    expect(balances.get("a")).toBe(Number.MAX_SAFE_INTEGER);
    expect(balances.get("b")).toBe(-Number.MAX_SAFE_INTEGER);
    expect(calculateGroupTotal(expenses)).toBe(Number.MAX_SAFE_INTEGER);
    expect(calculateMemberNet(expenses, "b")).toBe(-Number.MAX_SAFE_INTEGER);
  });
  it("rejects derived amounts beyond the safe range", () => {
    const expense = createExpense({
      id: "max",
      paid: [{ memberId: "a", amount: Number.MAX_SAFE_INTEGER }],
      owes: [],
    });
    expect(() => calculateBalances([expense, expense], ["a"])).toThrow("supported range");
    expect(() => calculateGroupTotal([expense, expense])).toThrow("supported range");
    expect(() => calculateMemberNet([expense, expense], "a")).toThrow("supported range");
  });
});

describe("suggestTransfers", () => {
  it("matches the largest debtor and creditor and clears all balances", () => {
    const balances = calculateBalances(EXPENSES, ["member-a", "member-b", "member-c"]);
    const before = new Map(balances);
    const transfers = suggestTransfers(balances);
    expect(transfers).toEqual([
      { fromMemberId: "member-c", toMemberId: "member-a", amount: 5000 },
      { fromMemberId: "member-b", toMemberId: "member-a", amount: 1500 },
    ]);
    expect(balances).toEqual(before);
    for (const transfer of transfers) {
      before.set(transfer.fromMemberId, before.get(transfer.fromMemberId)! + transfer.amount);
      before.set(transfer.toMemberId, before.get(transfer.toMemberId)! - transfer.amount);
    }
    expect([...before.values()]).toEqual([0, 0, 0]);
  });
  it("uses stable ID ordering for tied balances regardless of input order", () => {
    const entries: [string, number][] = [
      ["d", -1],
      ["b", 1],
      ["c", -1],
      ["a", 1],
    ];
    expect(suggestTransfers(new Map(entries))).toEqual([
      { fromMemberId: "c", toMemberId: "a", amount: 1 },
      { fromMemberId: "d", toMemberId: "b", amount: 1 },
    ]);
    expect(suggestTransfers(new Map(entries))).toEqual(
      suggestTransfers(new Map(entries.toReversed())),
    );
  });
  it("re-ranks remaining amounts after each transfer", () => {
    expect(
      suggestTransfers(
        new Map([
          ["a", 10],
          ["b", 8],
          ["c", -9],
          ["d", -9],
        ]),
      ),
    ).toEqual([
      { fromMemberId: "c", toMemberId: "a", amount: 9 },
      { fromMemberId: "d", toMemberId: "b", amount: 8 },
      { fromMemberId: "d", toMemberId: "a", amount: 1 },
    ]);
  });
  it("returns no transfers for zero balances", () => {
    expect(suggestTransfers(new Map())).toEqual([]);
    expect(suggestTransfers(new Map([["a", 0]]))).toEqual([]);
  });
  it("supports maximum safe transfers", () => {
    expect(
      suggestTransfers(
        new Map([
          ["a", Number.MAX_SAFE_INTEGER],
          ["b", -Number.MAX_SAFE_INTEGER],
        ]),
      ),
    ).toEqual([{ fromMemberId: "b", toMemberId: "a", amount: Number.MAX_SAFE_INTEGER }]);
  });
  it("rejects unbalanced or non-integer data", () => {
    expect(() => suggestTransfers(new Map([["a", 1]]))).toThrow("add up to zero");
    expect(() => suggestTransfers(new Map([["a", NaN]]))).toThrow("Invalid member balance");
  });
});
