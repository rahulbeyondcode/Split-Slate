import { describe, expect, it } from "vitest";

import { createExpenseSchema, expenseTransactions } from "@/features/expenses/utils/expense-schema";

import type { ExpenseFormValues } from "@/features/expenses/types/expenses.types";

const values = (): ExpenseFormValues => ({
  expenseName: " Dinner ",
  amount: "100.01",
  when: "2026-09-19T18:30",
  categoryId: "food",
  tagIds: [],
  payerMode: "single",
  payerId: "a",
  payers: [
    { memberId: "a", amount: "" },
    { memberId: "b", amount: "" },
  ],
  splitType: "equal",
  participants: [
    { memberId: "a", selected: true, value: "" },
    { memberId: "b", selected: true, value: "" },
  ],
});

describe("expense schema", () => {
  it("trims the name and balances a valid expense", () => {
    const parsed = createExpenseSchema("INR").parse(values());
    expect(parsed.expenseName).toBe("Dinner");
    expect(expenseTransactions(parsed, "INR").transactions).toEqual({
      paid: [{ memberId: "a", amount: 10001 }],
      owes: [
        { memberId: "a", amount: 5001 },
        { memberId: "b", amount: 5000 },
      ],
    });
  });
  it.each([
    { expenseName: " " },
    { amount: "0" },
    { amount: "-1" },
    { amount: "0.001" },
    { when: "invalid" },
    { when: "2026-02-30T12:00" },
    { categoryId: "" },
    { payerId: "" },
    { participants: [] },
    { tagIds: ["trip", "trip"] },
  ])("rejects invalid input %j", (patch) => {
    expect(createExpenseSchema("INR").safeParse({ ...values(), ...patch }).success).toBe(false);
  });
  it("validates multiple payers exactly", () => {
    const input = values();
    input.payerMode = "multiple";
    input.payers[0].amount = "40";
    input.payers[1].amount = "60.01";
    expect(createExpenseSchema("INR").safeParse(input).success).toBe(true);
    input.payers[1].amount = "60";
    expect(createExpenseSchema("INR").safeParse(input).success).toBe(false);
  });
  it("rejects duplicate payer contributions", () => {
    const input = values();
    input.payerMode = "multiple";
    input.payers = [
      { memberId: "a", amount: "50" },
      { memberId: "a", amount: "50.01" },
    ];
    expect(createExpenseSchema("INR").safeParse(input).success).toBe(false);
  });
  it("ignores unselected split members", () => {
    const input = values();
    input.participants[1].selected = false;
    expect(expenseTransactions(input, "INR").transactions.owes).toEqual([
      { memberId: "a", amount: 10001 },
    ]);
  });
});
