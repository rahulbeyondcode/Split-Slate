import { z } from "zod";

import { calculateSplit } from "@/features/expenses/utils/calculate-split";
import { parseMoney } from "@/shared/utils/money";

import type { ExpenseFormValues } from "@/features/expenses/types/expenses.types";

const required = (message: string) => z.string().trim().min(1, message);

export const expenseFieldsSchema = z.object({
  expenseName: required("Expense name is required"),
  amount: required("Amount is required"),
  when: required("Date and time are required"),
  categoryId: required("Choose a category"),
  tagIds: z.array(required("Invalid tag")),
  payerMode: z.enum(["single", "multiple"]),
  payerId: z.string().trim(),
  payers: z.array(z.object({ memberId: required("Invalid payer"), amount: z.string().trim() })),
  splitType: z.enum(["equal", "amount", "shares", "percentage", "adjustment"]),
  participants: z.array(
    z.object({
      memberId: required("Invalid participant"),
      selected: z.boolean(),
      value: z.string().trim(),
    }),
  ),
});

export const expenseTransactions = (values: ExpenseFormValues, currency: string) => {
  const total = parseMoney(values.amount, currency);
  if (total <= 0) throw new Error("Amount must be greater than zero");
  const paid =
    values.payerMode === "single"
      ? [{ memberId: values.payerId, amount: total }]
      : values.payers
          .map((payer) => ({
            memberId: payer.memberId,
            amount: parseMoney(payer.amount || "0", currency),
          }))
          .filter((payer) => payer.amount > 0);
  if (paid.some((payer) => !payer.memberId) || !paid.length) throw new Error("Choose who paid");
  if (new Set(paid.map((payer) => payer.memberId)).size !== paid.length)
    throw new Error("Duplicate payer");
  if (paid.reduce((sum, payer) => sum + BigInt(payer.amount), 0n) !== BigInt(total)) {
    throw new Error("Payer amounts must add up to the total");
  }
  const split = calculateSplit(
    total,
    values.splitType,
    values.participants.filter((member) => member.selected),
    currency,
  );
  return { transactions: { paid, owes: split.owes }, splitMeta: split.splitMeta };
};

export const createExpenseSchema = (currency: string) =>
  expenseFieldsSchema.superRefine((values, context) => {
    const date = new Date(values.when);
    // datetime-local values have no timezone; interpret them in the user's local timezone.
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(values.when);
    if (
      !dateMatch ||
      !Number.isFinite(date.getTime()) ||
      date.getFullYear() !== Number(dateMatch[1]) ||
      date.getMonth() + 1 !== Number(dateMatch[2]) ||
      date.getDate() !== Number(dateMatch[3]) ||
      date.getHours() !== Number(dateMatch[4]) ||
      date.getMinutes() !== Number(dateMatch[5])
    ) {
      context.addIssue({
        code: "custom",
        path: ["when"],
        message: "Enter a valid local date and time",
      });
    }
    if (new Set(values.tagIds).size !== values.tagIds.length) {
      context.addIssue({ code: "custom", path: ["tagIds"], message: "Duplicate tag" });
    }
    try {
      if (parseMoney(values.amount, currency) <= 0)
        throw new Error("Amount must be greater than zero");
    } catch (error) {
      context.addIssue({ code: "custom", path: ["amount"], message: (error as Error).message });
      return;
    }
    try {
      expenseTransactions(values, currency);
    } catch (error) {
      context.addIssue({
        code: "custom",
        path: ["participants"],
        message: (error as Error).message,
      });
    }
  });
